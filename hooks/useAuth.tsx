import React, { createContext, useContext, useState, ReactNode } from "react";
import { Alert } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// Extract API base URL
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

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
        })
      );
      console.log("profile", data);

      // Set user with name and email
      setUser({
        email: email,
        name: data.user.name,
        _id: data.user._id
      });

      const profileRes = await fetch(
        `${API_BASE_URL}user-data/${data.user._id}`
      );
      // const profileData = await profileRes.json();
      console.log("profile", profileRes.status);

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
    console.log("🚀 Starting Registration...");
    console.log("📦 Payload:", { name, email, password, phone, height, weight, gender, foodType, address, pincode, role: "User" });
    console.log("🔗 Target URL:", `${API_BASE_URL}auth/register`);

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

      console.log("📡 Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Registration Failed Response:", errorText);
        throw new Error(`Registration failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Registration Success Data:", data);

      await AsyncStorage.setItem(
        "registrationSessionId",
        data.registrationSessionId
      );
      // Don't set user here since we don't have _id yet
      // User will be set after OTP verification and login
      return true;
    } catch (err: any) {
      console.error("❌ Registration Error Catch:", err.message);
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

      const data = await response.json();
      setUser(null);
      await AsyncStorage.removeItem("userInfo");
      router.push("/login");
      return true;
    } catch (err: any) {
      console.error("Registration error:", err.message);
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
