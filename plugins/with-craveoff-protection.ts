import {
  ConfigPlugin,
  withAndroidManifest,
  AndroidConfig,
  withMainApplication,
  withAppBuildGradle,
  withDangerousMod,
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
          "android:exported": "false",
          "android:permission": "android.permission.BIND_VPN_SERVICE",
          // Keep type conservative for API 34 requirements
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
    }

    return config;
  });
};

const withAddPackageToMainApplication: ConfigPlugin = (config) => {
  return withMainApplication(config, (config) => {
    const pkg = config.android?.package ?? "com.craveoff.app";
    const contents = config.modResults.contents;
    const importLine = `import ${pkg}.craveoff.CraveOffProtectionPackage;`;
    if (!contents.includes(importLine)) {
      // Insert import after the last import
      config.modResults.contents = contents.replace(
        /(import .+;\s*)+(?!import)/,
        (match) => `${match}\n${importLine}\n`
      );
    }

    // Add package to getPackages()
    if (contents.includes("getPackages()")) {
      config.modResults.contents = config.modResults.contents.replace(
        /(\.getPackages\(\)\s*{[\s\S]*?return\s+)(Collections\.unmodifiableList\()?\s*new\s+ArrayList<ReactPackage>\(\)\s*{[\s\S]*?};?/,
        (match) => match
      );
    }

    // Generic approach: append to packages list via regex
    if (
      config.modResults.contents.includes("new PackageList(this).getPackages()")
    ) {
      // Older RN: augment packages list variable
      config.modResults.contents = config.modResults.contents.replace(
        /(List<ReactPackage>\s+packages\s*=\s*new PackageList\(this\)\.getPackages\(\);\s*)/,
        `$1\n      packages.add(new CraveOffProtectionPackage());\n`
      );
    } else {
      // Fallback: try to add inside getPackages override if present
      config.modResults.contents = config.modResults.contents.replace(
        /(packages\s*=\s*new PackageList\(this\)\.getPackages\(\);[\s\S]*?;)/,
        `$1\n      packages.add(new CraveOffProtectionPackage());`
      );
    }

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
      const appPackage = config.android?.package ?? "com.craveoff.app";
      const packagePath = appPackage.replace(/\./g, path.sep);
      const targetDir = path.join(javaDir, packagePath, "craveoff");

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
  return config;
};

export default withCraveOffProtection;
export { withCraveOffProtection };
