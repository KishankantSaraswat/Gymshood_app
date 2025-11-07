import "expo-router/entry";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useAuth } from "../hooks/useAuth";
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from "expo-linear-gradient";

// Hide splash screen immediately
SplashScreen.hideAsync();

export default function Index() {
  const { login, user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userInfo");
        if (storedUser) {
          const data = JSON.parse(storedUser);
          await login(data.email, data.password);
        }
        // Add minimum display time if needed
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log("Auto-login failed");
      } finally {
        setIsReady(true);
      }
    };
    prepare();
  }, []);

  if (!isReady) {
    return (
      <LinearGradient
        colors={['#6C63FF', '#4A42E8']}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          width: 80,
          height: 80,
          borderRadius: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <Text style={{ fontSize: 32, color: '#fff' }}>💪</Text>
        </View>
        
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: 10
        }}>
          Gymshood
        </Text>
        
        <Text style={{
          fontSize: 16,
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: 30
        }}>
          Your Fitness Journey
        </Text>
        
        <ActivityIndicator size="large" color="#fff" />
        
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.7)',
          marginTop: 15
        }}>
          Getting ready...
        </Text>
      </LinearGradient>
    );
  }

  // Redirect based on auth state
  if (user) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/login" />;
  }
}