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
    const ent = config.modResults;
    ent["com.apple.developer.family-controls"] = true;
    return config;
  });
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosProjectRoot = config.modRequest.platformProjectRoot;
      const projectName = config.modRequest.projectName || "App";
      const pluginIOSDir = path.join(projectRoot, "plugins", "craveoff-protection", "ios");
      const destDir = path.join(iosProjectRoot, projectName);
      const files = ["CraveOffProtectionModule.swift", "CraveOffProtectionModule.m"];
      for (const file of files) {
        const src = path.join(pluginIOSDir, file);
        if (fs.existsSync(src)) {
          const dest = path.join(destDir, file);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(src, dest);
        }
      }
      return config;
    },
  ]);
  config = withXcodeProject(config, (config) => {
    const proj = config.modResults;
    const firstTarget = proj.getFirstTarget().uuid;
    // Ensure we reference files with the project group prefix so Xcode links them into the main target
    const projectName = config.modRequest.projectName || "App";
    const swiftPath = `${projectName}/CraveOffProtectionModule.swift`;
    const mPath = `${projectName}/CraveOffProtectionModule.m`;
    try { proj.addSourceFile(swiftPath, { target: firstTarget, group: projectName }); } catch {}
    try { proj.addSourceFile(mPath, { target: firstTarget, group: projectName }); } catch {}
    proj.addBuildProperty("SWIFT_VERSION", "5.0");
    proj.addBuildProperty("IPHONEOS_DEPLOYMENT_TARGET", "16.0");
    return config;
  });
  return config;
};

module.exports = withCraveOffProtection;


