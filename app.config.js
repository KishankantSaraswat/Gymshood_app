import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "GymsHood",
  slug: "gymshood",
  version: "1.0.2",
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
    usesCleartextTraffic: true,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION"
    ],
    config: {
      googleMaps: {
        apiKey: "AIzaSyB-g-3ZZcBATKsPJgAywCk7CYI6CJnKD8s"
      }
    }
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
      "react-native-vision-camera",
      {
        "cameraPermissionText": "GymHood needs access to your camera to scan QR codes for check-in.",
        "microphonePermissionText": "GymHood needs access to your microphone (required by library, but not used for scanning)."
      }
    ],
    ["expo-splash-screen", {
      image: "./assets/images/logo.png",
      imageWidth: 300,
      resizeMode: "contain",
      backgroundColor: "#002147",
    }],
    ["expo-build-properties", {
      android: {
        usesCleartextTraffic: true
      }
    }]
  ],


  experiments: {
    typedRoutes: true,
  },

  extra: {
    API_BASE_URL: process.env.API_BASE_URL || "",
    eas: {
      projectId: "8d80bc22-7a77-40ba-bc9b-a85312f2d254"
    },
  },
});
