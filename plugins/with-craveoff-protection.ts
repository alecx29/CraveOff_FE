import {
  ConfigPlugin,
  withAndroidManifest,
  AndroidConfig,
  withMainApplication,
  withAppBuildGradle,
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} from "@expo/config-plugins";
import fs from "fs";
import path from "path";

type CraveOffProtectionProps = {
  dohEndpoint?: string;
};

const DEFAULT_DOH = "https://cloudflare-dns.com/dns-query";

const ensureUsesPermission = (
  manifest: AndroidConfig.Manifest.AndroidManifest,
  permission: string
) => {
  manifest.manifest["uses-permission"] =
    manifest.manifest["uses-permission"] || [];
  const list = manifest.manifest["uses-permission"];
  if (!list.find((p) => p.$["android:name"] === permission)) {
    list.push({
      $: { "android:name": permission },
    } as any);
  }
};

const withManifestEntries: ConfigPlugin<CraveOffProtectionProps> = (
  config,
  _props
) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    // Permissions
    ensureUsesPermission(manifest, "android.permission.INTERNET");
    ensureUsesPermission(manifest, "android.permission.ACCESS_NETWORK_STATE");
    ensureUsesPermission(manifest, "android.permission.FOREGROUND_SERVICE");
    // Android 14+ typed FGS permission for dataSync
    ensureUsesPermission(
      manifest,
      "android.permission.FOREGROUND_SERVICE_DATA_SYNC"
    );
    // Android 13+ notifications permission for foreground notification
    ensureUsesPermission(manifest, "android.permission.POST_NOTIFICATIONS");

    // Service
    const app = AndroidConfig.Manifest.getMainApplication(manifest);
    if (!app) return config;
    app.service = app.service || [];

    const pkg = config.android?.package ?? "com.craveoff.app";
    const serviceName = `${pkg}.craveoff.PornBlockVpnService`;

    const already = app.service.find(
      (s) => s.$["android:name"] === serviceName
    );
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
            action: [
              {
                $: { "android:name": "android.net.VpnService" },
              },
            ],
          },
        ],
      } as any);
    } else {
      // Ensure required attributes are present if service was already defined
      already.$["android:exported"] = already.$["android:exported"] ?? "true";
      already.$["android:permission"] =
        already.$["android:permission"] ??
        "android.permission.BIND_VPN_SERVICE";
      // Android 14+/targetSdk>=34 requires a typed FGS; declare dataSync type
      already.$["android:foregroundServiceType"] = "dataSync";
    }

    return config;
  });
};

const withAddPackageToMainApplication: ConfigPlugin = (config) => {
  return withMainApplication(config, (config) => {
    const pkg = config.android?.package ?? "com.craveoff.app";
    let contents = config.modResults.contents;
    const isKotlin =
      config.modResults.language === "kt" ||
      contents.includes("class MainApplication");
    const importLine = isKotlin
      ? `import ${pkg}.craveoff.CraveOffProtectionPackage`
      : `import ${pkg}.craveoff.CraveOffProtectionPackage;`;

    if (!contents.includes(importLine)) {
      // Insert after the last import
      contents = contents.replace(
        /(import .+\n)+(?!import)/,
        (match) => `${match}\n${importLine}\n`
      );
    }

    if (isKotlin) {
      // Kotlin template: val packages = PackageList(this).packages
      const anchor = /val\s+packages\s*=\s*PackageList\(this\)\.packages/;
      if (
        anchor.test(contents) &&
        !contents.includes("CraveOffProtectionPackage()")
      ) {
        contents = contents.replace(
          anchor,
          (m) => `${m}\n            packages.add(CraveOffProtectionPackage())`
        );
      }
    } else {
      // Java template
      const javaAnchor = /new\s+PackageList\(this\)\.getPackages\(\);/;
      if (
        javaAnchor.test(contents) &&
        !contents.includes("new CraveOffProtectionPackage()")
      ) {
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

const withOkHttpDependency: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (config) => {
    const depsToAdd = [
      `implementation("com.squareup.okhttp3:okhttp:4.12.0")`,
      `implementation("androidx.work:work-runtime-ktx:2.9.0")`,
    ];
    let contents = config.modResults.contents;
    // Safer: append a separate dependencies block at EOF if missing
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

const writeFileEnsured = (destPath: string, content: string) => {
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, content);
};

const withCopyKotlinSources: ConfigPlugin<CraveOffProtectionProps> = (
  config,
  props
) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidDir = path.join(projectRoot, "android");
      const appSrcMain = path.join(androidDir, "app", "src", "main");
      const javaDir = path.join(appSrcMain, "java");
      const resDir = path.join(appSrcMain, "res");
      const appPackage = config.android?.package ?? "com.craveoff.app";
      const packagePath = appPackage.replace(/\./g, path.sep);
      const targetDir = path.join(javaDir, packagePath, "craveoff");

      // Workaround Windows prebuild timing: ensure mipmap directories exist before icon generation
      const mipmaps = [
        "mipmap-mdpi",
        "mipmap-hdpi",
        "mipmap-xhdpi",
        "mipmap-xxhdpi",
        "mipmap-xxxhdpi",
      ];
      for (const m of mipmaps) {
        fs.mkdirSync(path.join(resDir, m), { recursive: true });
      }

      const pluginAndroidDir = path.join(
        projectRoot,
        "plugins",
        "craveoff-protection",
        "android"
      );
      const files = [
        "CraveOffProtectionModule.kt",
        "CraveOffProtectionPackage.kt",
        "PornBlockVpnService.kt",
        "NotificationUtils.kt",
        "ProtectionHealthWorker.kt",
      ];

      for (const file of files) {
        const template = fs.readFileSync(
          path.join(pluginAndroidDir, file),
          "utf8"
        );
        const replaced = template
          .replace(/__PACKAGE__/g, appPackage)
          .replace(/__DOH_ENDPOINT__/g, props?.dohEndpoint ?? DEFAULT_DOH);
        writeFileEnsured(path.join(targetDir, file), replaced);
      }
      return config;
    },
  ]);
};

const withCraveOffProtection: ConfigPlugin<CraveOffProtectionProps> = (
  config,
  props
) => {
  config = withManifestEntries(config, props);
  config = withAddPackageToMainApplication(config);
  config = withOkHttpDependency(config);
  config = withCopyKotlinSources(config, props);
  // iOS: add Family Controls entitlement, copy/link Swift sources, and set minimal build settings
  config = withEntitlementsPlist(config, (config) => {
    const ent = config.modResults;
    // FamilyControls entitlement (requires Apple approval)
    (ent as any)["com.apple.developer.family-controls"] = true;
    return config;
  });
  // Copy Swift/ObjC bridge sources into the iOS project directory
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosProjectRoot = config.modRequest.platformProjectRoot;
      const projectName = config.modRequest.projectName ?? "App";
      const pluginIOSDir = path.join(
        projectRoot,
        "plugins",
        "craveoff-protection",
        "ios"
      );
      const destDir = path.join(iosProjectRoot, projectName);
      const files = [
        "CraveOffProtectionModule.swift",
        "CraveOffProtectionModule.m",
      ];
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
  // Link the Swift/ObjC sources to the Xcode project and ensure build settings
  config = withXcodeProject(config, (config) => {
    const proj = config.modResults;
    const swiftFile = "CraveOffProtectionModule.swift";
    const mFile = "CraveOffProtectionModule.m";
    const firstTarget = proj.getFirstTarget().uuid;
    // Add source files (idempotent)
    try {
      proj.addSourceFile(swiftFile, { target: firstTarget });
    } catch {}
    try {
      proj.addSourceFile(mFile, { target: firstTarget });
    } catch {}
    // Ensure Swift version and iOS deployment target (iOS 16 for FamilyControls/ManagedSettings)
    proj.addBuildProperty("SWIFT_VERSION", "5.0");
    proj.addBuildProperty("IPHONEOS_DEPLOYMENT_TARGET", "16.0");
    return config;
  });
  return config;
};

export default withCraveOffProtection;
export { withCraveOffProtection };
