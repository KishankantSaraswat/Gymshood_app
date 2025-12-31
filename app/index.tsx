import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Redirect } from "expo-router";
import "expo-router/entry";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

// Keep splash screen visible during initialization
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { login, user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      console.log("🚀 App Mounting: Starting initialization...");
      try {
        // Check Backend Connection
        const apiUrl = Constants.expoConfig?.extra?.API_BASE_URL;
        console.log(`📡 Checking connection to: ${apiUrl}`);

        try {
          const pingRes = await fetch(`${apiUrl}ping`);
          const pingData = await pingRes.json();
          console.log("✅ Backend Connected Successfully:", pingData.message);
        } catch (err: any) {
          console.error("❌ Backend Connection Failed:", err.message);
          console.error("❌ Full Error:", err);
        }

        const storedUser = await AsyncStorage.getItem("userInfo");
        console.log("💾 Stored User Data:", storedUser ? "Found" : "Not Found");

        if (storedUser) {
          const data = JSON.parse(storedUser);
          console.log("🔄 Attempting Auto-login for:", data.email);
          await login(data.email, data.password);
        }
      } catch (error) {
        console.log("⚠️ Auto-login/Init failed:", error);
      } finally {
        console.log("🏁 Initialization Complete. Ready to render.");
        setIsReady(true);
        // Hide splash screen once ready
        await SplashScreen.hideAsync();
      }
    };
    prepare();
  }, []);

  // Don't render anything until ready - splash screen will be visible
  if (!isReady) {
    return null;
  }

  // Redirect based on auth state
  if (user) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/login" />;
  }
}