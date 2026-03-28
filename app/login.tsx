import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const openPrivacyPolicy = () => {
    Linking.openURL("https://gymshood.blogspot.com/p/privacy-policy.html");
  };

  const openTermsConditions = () => {
    Linking.openURL("https://gymshood.blogspot.com/p/terms-conditions.html");
  };

  const handleLogin = async () => {
    console.log("🔑 Login Attempt Started");
    console.log("📧 Email:", email);
    // console.log("🔑 Password:", password); // Don't log passwords in production!

    if (!email || !password) {
      console.log("⚠️ Login Validation Failed: Missing fields");
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      console.log("🚀 Calling login hook...");
      const success = await login(email, password);
      console.log("📡 Login Hook Result:", success);

      if (success) {
        console.log("✅ Login Successful! Redirecting to gym selection...");
        router.replace("/selectGym");
      } else {
        console.log("❌ Login Failed (Hook returned false/undefined)");
      }
    } catch (error) {
      console.error("❌ Login Error:", error);
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setLoading(false);
      console.log("🏁 Login Attempt Finished");
    }
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password");
  };

  const handleRegister = () => {
    router.push("/register");
  };

  useEffect(() => {
    const checkStoredData = async () => {
      console.log("💾 Checking for stored user data...");
      const user = await AsyncStorage.getItem("userInfo");
      console.log("💾 Stored Data Found:", !!user);

      if (user) {
        try {
          const data = JSON.parse(user);
          console.log("🔄 Auto-filling login form for:", data.email);
          setEmail(data.email);
          setPassword(data.password);

          setLoading(true);
          try {
            console.log("🚀 Triggering Auto-Login...");
            await login(data.email, data.password);
          } catch (error) {
            console.error("❌ Auto-Login Failed:", error);
            Alert.alert("Error", "Login failed. Please try again.");
          } finally {
            setLoading(false);
          }
        } catch (parseError) {
          console.error("❌ Failed to parse stored user data:", parseError);
        }
      }
    };
    checkStoredData();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Gymshood</Text>
          <Text style={styles.subtitle}>Welcome back!</Text>
          <Text>Enter your email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text>Enter your password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="#a4a1a1ff"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.policyLinksContainer}>
            <Text style={styles.policyText}>
              By using our app, you agree to our{" "}
            </Text>
            <TouchableOpacity onPress={openTermsConditions}>
              <Text style={styles.policyLink}>Terms & Conditions</Text>
            </TouchableOpacity>
            <Text style={styles.policyText}> and </Text>
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text style={styles.policyLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.linkText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  policyLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  policyText: {
    color: '#666',
    fontSize: 12,
  },
  policyLink: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#000",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    color: "#000",
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  linkText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 15,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
});
