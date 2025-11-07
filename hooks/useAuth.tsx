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
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Default context value
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
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
        throw new Error("Invalid credentials");
      }

      const data = await response.json();

      await AsyncStorage.setItem(
        "userInfo",
        JSON.stringify({
          email: email,
          name: data.name,
          password: password,
          _id: data.user._id,
        })
      );
      console.log("profile", data);
      setUser({ email: data.email, name: data.name });
      const profileRes = await fetch(
        `${API_BASE_URL}user-data/${data.user._id}`
      );
      // const profileData = await profileRes.json();
      console.log("profile", profileRes.status);

      if (profileRes.status === 404) {
        router.replace("/UserDataScreen");
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
  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "User" }),
      });
      if (!response.ok) throw new Error("Registration failed");

      const data = await response.json();
      await AsyncStorage.setItem(
        "registrationSessionId",
        data.registrationSessionId
      );
      setUser({ email: data.email, name: data.name });
      return true;
    } catch (err: any) {
      console.error("Registration error:", err.message);
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
