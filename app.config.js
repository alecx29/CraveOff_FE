/* eslint-env node */
/* global __dirname */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Expo configuration
module.exports = {
  expo: {
    name: "CraveOff",
    slug: "craveoff-app",
    version: "1.2.31",

    // Note: These properties will not be synced when android/ios folders are present
    orientation: "portrait",
    icon: "./assets/images/logoCraveoff-512.png",
    scheme: "craveoffapp",
    userInterfaceStyle: "automatic",

    updates: {
      url: "https://u.expo.dev/ab8a7457-9c09-4b84-946e-2dee70f210b1",
      enabled: true,
      checkAutomatically: "ON_ERROR_RECOVERY",
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },

    newArchEnabled: false,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.usualsuspect29.craveoffapp",
      icon: "./assets/images/logoCraveoff-512.png",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "NSCameraUsageDescription": "CraveOff needs access to the front camera to show the image in Panic Mode."
      },
      config: {
        usesAppleSignIn: true
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/play_store_512.png",
        backgroundColor: "#000000"
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "resize",

      package: "com.usualsuspect29.craveoffapp",
      versionCode: 58,
      notification: {
        icon: "./assets/images/ic_launcher.png",
        color: "#6366f1"
      },
      googleServicesFile: "./google-services.json",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "*.craveoffapp.com",
              pathPrefix: "/"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/play_store_512.png"
    },

    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 26
          },
          "ios": {
            "deploymentTarget": "16.0"
          }
        }
      ],
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/logo.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          // Align native splash with the animated gradient background to avoid a visible flash
          "backgroundColor": "#000000"
        }
      ],
      "expo-notifications",
      "expo-secure-store",
      "expo-dev-client",
      "expo-web-browser",
      [
        "expo-apple-authentication",
        {
          "serviceId": "com.usualsuspect29.craveoffapp",
          "teamId": "S5YUB44YKU" // Înlocuiți cu Team ID-ul dvs. din Apple Developer Portal
        }
      ],
      [
        "./plugins/with-craveoff-protection",
        {
          dohEndpoint: "https://cloudflare-dns.com/dns-query"
        }
      ]
    ],

    experiments: {
      typedRoutes: true
    },

    extra: {
      router: {},
      eas: {
        projectId: "ab8a7457-9c09-4b84-946e-2dee70f210b1"
      },
      STREAMING_MODE: "false",
      googleWebClientId: "391159890839-orc2jub1onifvuqgtchj0tonpsd5jn61.apps.googleusercontent.com",
      googleAndroidClientId: "391159890839-va2ga57lfrnfugnhn4mvm01jdug850rv.apps.googleusercontent.com",
      googleIosClientId: "391159890839-bh8c7d8toeqfjbg4cj1k2438ao5pajon.apps.googleusercontent.com",
      appleServiceId: "com.usualsuspect29.craveoffapp",
      // Set this when you have the App Store id to deep-link to rating
      iosAppStoreId: "6748585691",
      // Used at runtime to build Play Store links
      androidPackage: "com.usualsuspect29.craveoffapp",
      // Optional: point to a remote JSON with { ios: { minBuild, latest }, android: { minBuild, latest } }
      updateConfigUrl: "https://craveoff-production.up.railway.app/api/config/update",
      // Enable UpdateGate for dev builds so you can test locally
      enableUpdateGateInDev: true,
      // Supabase (read from env at build time; do NOT expose service_role key in client)
      supabaseUrl: process.env.SUPABASE_PROJECT_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      revenueCat: {
        iosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "",
        androidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "",
        publicApiKey: process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY || "",
        entitlementId: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "craveoff_premium",
        // Optional: set to a specific RevenueCat Offering identifier to force which dashboard paywall is shown
        // (otherwise the SDK will use the "current" offering / first offering)
        paywallOfferingId: process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID || ""
      },
      superwall: {
        // Superwall "Public API Key" is per-platform app in the Superwall dashboard.
        // Prefer platform-specific EXPO_PUBLIC_* vars, but allow a single generic key for quick local testing.
        // NOTE: Fallback keys below are for local debugging only. Prefer using EXPO_PUBLIC_* env vars.
        iosApiKey: process.env.EXPO_PUBLIC_SUPERWALL_IOS_KEY || process.env.EXPO_SUPERWALL_PUBLIC_API_KEY || "pk_1tKyBjngSPyyRhHcAtRYz",
        androidApiKey: process.env.EXPO_PUBLIC_SUPERWALL_ANDROID_KEY || process.env.EXPO_SUPERWALL_PUBLIC_API_KEY || "pk_K0Y9JPpF1f7wWrKTqDKBv",
        // Must match the exact Placement ID in Superwall (case-sensitive)
        testPlacement: process.env.EXPO_PUBLIC_SUPERWALL_TEST_PLACEMENT || "upgrade_pressed"
      }
    },

    // Disable the development status bar
    developmentClient: {
      silentLaunch: true
    }
  }
}; 