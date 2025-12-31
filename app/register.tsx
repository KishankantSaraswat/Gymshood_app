import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    router.push({
      pathname: "/moreDetails",
      params: {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
      },
    });
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      // Simulate registration API call
      const success = await register(form.name, form.email, form.password);
      if (success) {
        router.push({
          pathname: "/otpVerification",
          params: { email: form.email },
        });
      } else {
        Alert.alert("Error", "Registration failed. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const openPrivacyPolicy = () => {
    Linking.openURL("https://gymshood.blogspot.com/p/privacy-policy.html");
  };

  const openTermsConditions = () => {
    Linking.openURL("https://gymshood.blogspot.com/p/terms-conditions.html");
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Gymshood today</Text>
        <Text>Enter your full name</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={form.name}
          onChangeText={(text) => setForm({ ...form, name: text })}
        />
        <Text>Enter your email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChangeText={(text) => setForm({ ...form, email: text })}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text>Enter your phone number</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={form.phone}
          onChangeText={(text) => setForm({ ...form, phone: text })}
          keyboardType="phone-pad"
          maxLength={10}   // optional: limit to 10 digits
        />

        <Text>Enter your password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
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

        <Text>Confirm your password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
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
        {/* <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating Account..." : "Register"}
          </Text>
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>


        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Reuse the same styles from ForgotPasswordScreen
const styles = StyleSheet.create({
  policyLinksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
  },
  policyText: {
    color: "#666",
    fontSize: 12,
  },
  policyLink: {
    color: "#ff6b6b",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
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
    marginTop: 10,
    marginBottom: 20,
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
    textAlign: "center",
  },
});
