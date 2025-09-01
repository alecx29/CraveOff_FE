// Expo configuration
module.exports = {
  expo: {
    name: "craveoff-app",
    slug: "craveoff-app",
    version: "1.2.0",
    
    // Note: These properties will not be synced when android/ios folders are present
    orientation: "portrait",
    icon: "./assets/images/logoCraveoff-512.png",
    scheme: "craveoffapp",
    userInterfaceStyle: "automatic",
    
    newArchEnabled: true,
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.usualsuspect29.craveoffapp",
      icon: "./assets/images/logoCraveoff-512.png",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
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
      package: "com.usualsuspect29.craveoffapp",
      versionCode: 20,
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
        "expo-splash-screen",
        {
          "image": "./assets/images/logo.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#000000"
        }
      ],
      "expo-secure-store",
      "expo-dev-client",
      "expo-web-browser",
      [
        "expo-apple-authentication",
        {
          "serviceId": "com.usualsuspect29.craveoffapp",
          "teamId": "S5YUB44YKU" // Înlocuiți cu Team ID-ul dvs. din Apple Developer Portal
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
      STREAMING_MODE: "true",
      googleWebClientId: "391159890839-orc2jub1onifvuqgtchj0tonpsd5jn61.apps.googleusercontent.com",
      googleAndroidClientId: "391159890839-va2ga57lfrnfugnhn4mvm01jdug850rv.apps.googleusercontent.com",
      googleIosClientId: "391159890839-bh8c7d8toeqfjbg4cj1k2438ao5pajon.apps.googleusercontent.com",
      appleServiceId: "com.usualsuspect29.craveoffapp"
    },
    
    // Disable the development status bar
    developmentClient: {
      silentLaunch: true
    }
  }
}; 