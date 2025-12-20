const {
  withAndroidManifest,
  AndroidConfig,
  withMainApplication,
  withAppBuildGradle,
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const DEFAULT_DOH = "https://cloudflare-dns.com/dns-query";
const POD_DEP_TOKEN = "pod 'CraveOffProtection', :path => '../plugins/craveoff-protection/ios'";
// Keep widest support; use shield.webDomains (WebContentFilter not available in current SDK)
const MIN_IOS_VERSION = "16.0";

const log = (...args) => {
  try {
    console.log("[with-craveoff-protection]", ...args);
  } catch {
    // no-op if console unavailable
  }
};

function ensureUsesPermission(manifest, permission) {
  manifest.manifest["uses-permission"] = manifest.manifest["uses-permission"] || [];
  const list = manifest.manifest["uses-permission"];
  if (!list.find((p) => p.$["android:name"] === permission)) {
    list.push({
      $: { "android:name": permission },
    });
  }
}

const withManifestEntries = (config, _props) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    ensureUsesPermission(manifest, "android.permission.INTERNET");
    ensureUsesPermission(manifest, "android.permission.ACCESS_NETWORK_STATE");
    ensureUsesPermission(manifest, "android.permission.FOREGROUND_SERVICE");
    // Android 14+ typed FGS permission for dataSync
    ensureUsesPermission(manifest, "android.permission.FOREGROUND_SERVICE_DATA_SYNC");
    ensureUsesPermission(manifest, "android.permission.POST_NOTIFICATIONS");

    const app = AndroidConfig.Manifest.getMainApplication(manifest);
    if (!app) return config;
    app.service = app.service || [];

    const pkg = (config.android && config.android.package) || "com.craveoff.app";
    const serviceName = `${pkg}.craveoff.PornBlockVpnService`;

    const already = app.service.find((s) => s.$["android:name"] === serviceName);
    if (!already) {
      app.service.push({
        $: {
          "android:name": serviceName,
          "android:exported": "true",
          "android:permission": "android.permission.BIND_VPN_SERVICE",
          "android:foregroundServiceType": "dataSync",
        },
        "intent-filter": [
          {
            action: [{ $: { "android:name": "android.net.VpnService" } }],
          },
        ],
      });
    } else {
      // Ensure attributes exist even if service was previously added
      already.$["android:exported"] = already.$["android:exported"] || "true";
      already.$["android:permission"] =
        already.$["android:permission"] || "android.permission.BIND_VPN_SERVICE";
      already.$["android:foregroundServiceType"] = "dataSync";
    }

    return config;
  });
};

const withAddPackageToMainApplication = (config) => {
  return withMainApplication(config, (config) => {
    const pkg = (config.android && config.android.package) || "com.craveoff.app";
    let contents = config.modResults.contents;
    const isKotlin = config.modResults.language === "kt" || contents.includes("class MainApplication");
    const importLine = isKotlin
      ? `import ${pkg}.craveoff.CraveOffProtectionPackage`
      : `import ${pkg}.craveoff.CraveOffProtectionPackage;`;

    if (!contents.includes(importLine)) {
      contents = contents.replace(
        /(import .+\n)+(?!import)/,
        (match) => `${match}\n${importLine}\n`
      );
    }

    if (isKotlin) {
      const anchor = /val\s+packages\s*=\s*PackageList\(this\)\.packages/;
      if (anchor.test(contents) && !contents.includes("CraveOffProtectionPackage()")) {
        contents = contents.replace(
          anchor,
          (m) => `${m}\n            packages.add(CraveOffProtectionPackage())`
        );
      }
    } else {
      const javaAnchor = /new\s+PackageList\(this\)\.getPackages\(\);/;
      if (javaAnchor.test(contents) && !contents.includes("new CraveOffProtectionPackage()")) {
        contents = contents.replace(
          javaAnchor,
          (m) => `${m}\n      packages.add(new CraveOffProtectionPackage());`
        );
      }
    }
    config.modResults.contents = contents;

    return config;
  });
};

const withOkHttpDependency = (config) => {
  return withAppBuildGradle(config, (config) => {
    const depsToAdd = [
      `implementation("com.squareup.okhttp3:okhttp:4.12.0")`,
      `implementation("androidx.work:work-runtime-ktx:2.9.0")`,
    ];
    let contents = config.modResults.contents;
    const missing = depsToAdd.filter((d) => !contents.includes(d));
    if (missing.length > 0) {
      contents = `${contents}\n// Added by with-craveoff-protection\ndependencies {\n  ${missing.join(
        "\n  "
      )}\n}\n`;
      config.modResults.contents = contents;
    }
    return config;
  });
};

function writeFileEnsured(destPath, content) {
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, content);
}

const withCopyKotlinSources = (config, props) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      log("Android: copying CraveOff protection sources");
      const projectRoot = config.modRequest.projectRoot;
      const androidDir = path.join(projectRoot, "android");
      const appSrcMain = path.join(androidDir, "app", "src", "main");
      const javaDir = path.join(appSrcMain, "java");
      const resDir = path.join(appSrcMain, "res");
      const appPackage = (config.android && config.android.package) || "com.craveoff.app";
      const packagePath = appPackage.replace(/\./g, path.sep);
      const targetDir = path.join(javaDir, packagePath, "craveoff");

      // Workaround Windows prebuild timing: ensure mipmap directories exist before icon generation
      const mipmaps = ["mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi"];
      for (const m of mipmaps) {
        fs.mkdirSync(path.join(resDir, m), { recursive: true });
      }

      const pluginAndroidDir = path.join(projectRoot, "plugins", "craveoff-protection", "android");
      const files = [
        "CraveOffProtectionModule.kt",
        "CraveOffProtectionPackage.kt",
        "PornBlockVpnService.kt",
        "NotificationUtils.kt",
        "ProtectionHealthWorker.kt",
      ];

      for (const file of files) {
        const template = fs.readFileSync(path.join(pluginAndroidDir, file), "utf8");
        const replaced = template
          .replace(/__PACKAGE__/g, appPackage)
          .replace(/__DOH_ENDPOINT__/g, (props && props.dohEndpoint) || DEFAULT_DOH);
        writeFileEnsured(path.join(targetDir, file), replaced);
        log("Android: wrote", path.join(targetDir, file));
      }
      return config;
    },
  ]);
};

const ensurePodfileContainsDependency = (contents, targetName) => {
  if (contents.includes(POD_DEP_TOKEN)) {
    return contents;
  }
  const targetRegex = new RegExp(`target '${targetName}' do`);
  if (!targetRegex.test(contents)) {
    log(`iOS: target '${targetName}' not found in Podfile; skipping pod install`);
    return contents;
  }
  return contents.replace(
    targetRegex,
    (match) => `${match}\n  ${POD_DEP_TOKEN}`
  );
};

const withIosPodDependency = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      const targetName = config.modRequest.projectName || "App";
      try {
        const original = fs.readFileSync(podfilePath, "utf8");
        const updated = ensurePodfileContainsDependency(original, targetName);
        if (updated !== original) {
          fs.writeFileSync(podfilePath, updated);
          log("iOS: registered CraveOffProtection pod dependency");
        } else {
          log("iOS: CraveOffProtection pod dependency already present or target missing");
        }
      } catch (err) {
        log("iOS: failed to patch Podfile for CraveOffProtection", err?.message || err);
      }
      return config;
    },
  ]);
};

const withIosDeploymentTarget = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const propsPath = path.join(config.modRequest.platformProjectRoot, "Podfile.properties.json");
      try {
        let props = {};
        if (fs.existsSync(propsPath)) {
          props = JSON.parse(fs.readFileSync(propsPath, "utf8"));
        }
        const current = props["ios.deploymentTarget"];
        if (current !== MIN_IOS_VERSION) {
          props["ios.deploymentTarget"] = MIN_IOS_VERSION;
          fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));
          log(`iOS: set Podfile.properties ios.deploymentTarget to ${MIN_IOS_VERSION}`);
        }
      } catch (err) {
        log("iOS: failed to update Podfile.properties.json", err?.message || err);
      }
      return config;
    },
  ]);
};

const withCraveOffProtection = (config, props) => {
  config = withManifestEntries(config, props);
  config = withAddPackageToMainApplication(config);
  config = withOkHttpDependency(config);
  config = withCopyKotlinSources(config, props);
  // iOS: entitlement + copy/link sources
  config = withEntitlementsPlist(config, (config) => {
    log("iOS: enabling Family Controls entitlement");
    const ent = config.modResults;
    ent["com.apple.developer.family-controls"] = true;
    return config;
  });
  config = withIosDeploymentTarget(config);
  config = withIosPodDependency(config);
  config = withXcodeProject(config, (config) => {
    log("iOS: ensuring Swift build settings for CraveOff protection");
    const proj = config.modResults;
    proj.addBuildProperty("SWIFT_VERSION", "5.0");
    proj.addBuildProperty("IPHONEOS_DEPLOYMENT_TARGET", "16.0");
    return config;
  });
  return config;
};

module.exports = withCraveOffProtection;


