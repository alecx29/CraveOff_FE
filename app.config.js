// Expo configuration
module.exports = {
  expo: {
    name: "craveoff-app",
    slug: "craveoff-app",
    version: "1.0.0",
    
    // Note: These properties will not be synced when android/ios folders are present
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "craveoffapp",
    userInterfaceStyle: "automatic",
    
    newArchEnabled: true,
    
    ios: {
      supportsTablet: true
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.usualsuspect29.craveoffapp",
      versionCode: 3
    },
    
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      "expo-secure-store"
    ],
    
    experiments: {
      typedRoutes: true
    },
    
    extra: {
      router: {},
      eas: {
        projectId: "ab8a7457-9c09-4b84-946e-2dee70f210b1"
      },
      STREAMING_MODE: "true"
    }
  }
}; 