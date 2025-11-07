import React, { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet, Text  } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth"; // adjust the path
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';



// Extract API base URL
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";


const OtpVerificationScreen = () => {
  const [otp, setOtp] = useState("");
    const router = useRouter();
  const route = useRoute();
  const { email } = route.params as { email: string };
  const { login } = useAuth();

  const handleVerify = async () => {
    try {
      const registrationSessionId = AsyncStorage.getItem('registrationSessionId');
      const response = await fetch(`${API_BASE_URL}auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, registrationSessionId }),
      });

      if (!response.ok) throw new Error("OTP verification failed");

      const result = await response.json();
      if (result.success) {
        Alert.alert("Success", "Registration Successfull");
        router.push("/login"); // or however your system logs in
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
<View style={styles.container}>
      <Text style={styles.heading}>Verify OTP</Text>

      <Text style={styles.label}>Enter the OTP sent to your email:</Text>
      <TextInput
        style={styles.input}
        placeholder="123456"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
      />

      <View style={styles.buttonContainer}>
        <Button title="Verify OTP" onPress={handleVerify} color="#007BFF" />
      </View>
    </View>
  );
};

export default OtpVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#555",
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    backgroundColor: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 12,
  },
});