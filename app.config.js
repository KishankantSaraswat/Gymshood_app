import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "GymsHood",
  slug: "gymshood",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "gymshood",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.mohdqounane.gymshood",
  },

  android: {
    "googleServicesFile": "google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    package: "com.mohdqounane.gymshood",
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/icon.png",
  },

  plugins: [
    "expo-router",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/logo.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    API_BASE_URL: process.env.API_BASE_URL || "",
    eas: {
      projectId: "4e558ab6-f247-4371-b6d0-a6aea6740924"
    },
  },
});
