import React, { createContext, useContext, useState, ReactNode } from "react";
import { Alert, Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Extract API base URL
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

// Configure notifications handler safely
try {
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.warn("⚠️ Notification system failed to initialize:", e.message);
}

async function registerForPushNotificationsAsync(userId: string, authToken: string) {
  let token;

  try {
    // 🛡️ Safety first: check if expo-notifications and expo-device are actually linked/working
    if (!Notifications || typeof Notifications.getExpoPushTokenAsync !== 'function') {
      console.log("ℹ️ Notification native module not available. Skipping registration.");
      return;
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (channelErr) {
        console.warn("Could not set notification channel:", channelErr.message);
      }
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted.');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn('Project ID not found in expo config');
        return;
      }

      try {
        // Change from getExpoPushTokenAsync (Expo Push Service) to getDevicePushTokenAsync (Native FCM)
        // because the backend is using Firebase Admin SDK directly.
        token = (await Notifications.getDevicePushTokenAsync()).data;
        console.log("🎟️ Native FCM Token generated:", token);

        // Send token to backend
        const response = await fetch(`${API_BASE_URL}auth/update-fcm-token`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify({ fcmToken: token }),
        });
        console.log("📡 Token Registration Response Status:", response.status);
      } catch (tokenErr) {
        console.warn("❌ Failed to get or send Native FCM Token:", tokenErr.message);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  } catch (err) {
    console.warn("❌ Non-fatal notification error caught:", err.message);
  }

  return token;
}

// Define the User type
interface User {
  email: string;
  name: string;
  _id: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
    height?: string,
    weight?: string,
    gender?: string,
    foodType?: string,
    address?: string,
    pincode?: string
  ) => Promise<boolean>;
  logout: () => void;
}

// Default context value
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  register: async () => false,
  logout: () => { },
});

// Props for the AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider implementation
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    const role = "User";
    try {
      const response = await fetch(`${API_BASE_URL}auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Login Failed Response:", errorData);
        throw new Error(errorData.message || "Invalid credentials");
      }

      const data = await response.json();

      await AsyncStorage.setItem(
        "userInfo",
        JSON.stringify({
          email: email,
          name: data.user.name,
          password: password,
          _id: data.user._id,
          token: data.token
        })
      );

      // Set user with name and email
      setUser({
        email: email,
        name: data.user.name,
        _id: data.user._id
      });

      // Register for push notifications after successful login (background task)
      registerForPushNotificationsAsync(data.user._id, data.token).catch(err => {
        console.log("Ignored notification error during login:", err.message);
      });

      const profileRes = await fetch(
        `${API_BASE_URL}user-data/${data.user._id}`
      );

      if (profileRes.status === 404) {
        router.replace("/UserDataScreen?isNewUser=true");
      } else if (profileRes.status === 200) {
        router.replace("/(tabs)");
      } else {
        throw new Error("Unexpected response while checking user data");
      }

      return true;
    } catch (err: any) {
      console.error("Login error:", err.message);
      Alert.alert("Login failed", err.message);
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    height?: string,
    weight?: string,
    gender?: string,
    foodType?: string,
    address?: string,
    pincode?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          height: height ? Number(height) : undefined,
          weight: weight ? Number(weight) : undefined,
          gender,
          foodType,
          address,
          pincode,
          role: "User"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Registration failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      await AsyncStorage.setItem("registrationSessionId", data.registrationSessionId);
      return true;
    } catch (err: any) {
      console.error("❌ Registration Error:", err.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}auth/logout`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Logout Failed");

      setUser(null);
      await AsyncStorage.removeItem("userInfo");
      router.push("/login");
      return true;
    } catch (err: any) {
      console.error("Logout error:", err.message);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);
