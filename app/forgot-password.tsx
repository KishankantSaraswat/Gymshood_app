import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSessionId, setResetSessionId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}auth/password/forgot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("Forgot Password Response:", data);

      if (response.ok) {
        Alert.alert("Success", data.message || "OTP sent to your email");
        setStep(2); // Move to OTP verification step
      } else {
        Alert.alert("Error", data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}auth/password/verify-reset-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      console.log("Verify OTP Response:", data);

      if (response.ok) {
        setResetSessionId(data.resetSessionId);
        Alert.alert("Success", "OTP verified successfully");
        setStep(3); // Move to password reset step
      } else {
        Alert.alert("Error", data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      Alert.alert("Error", "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please enter both password fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    if (password.length < 8 || password.length > 16) {
      Alert.alert("Error", "Password must be between 8 and 16 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}auth/password/reset`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resetSessionId, password, confirmPassword }),
      });

      const data = await response.json();
      console.log("Reset Password Response:", data);

      if (response.ok) {
        Alert.alert(
          "Success",
          "Password reset successfully. Please login with your new password.",
          [{ text: "OK", onPress: () => router.replace("/login") }]
        );
      } else {
        Alert.alert("Error", data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Error", "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
        <Text style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}>1</Text>
      </View>
      <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
      <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
        <Text style={[styles.stepNumber, step >= 2 && styles.stepNumberActive]}>2</Text>
      </View>
      <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
      <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
        <Text style={[styles.stepNumber, step >= 3 && styles.stepNumberActive]}>3</Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive an OTP
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Sending..." : "Send OTP"}
              </Text>
            </TouchableOpacity>
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit OTP sent to
            </Text>
            <Text style={styles.emailText}>{email}</Text>

            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="000000"
              placeholderTextColor="#999"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSendOTP}>
              <Text style={styles.linkText}>Resend OTP</Text>
            </TouchableOpacity>
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>
              Create a strong password (8-16 characters)
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                placeholderTextColor="#999"
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

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Resetting..." : "Reset Password"}
              </Text>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepIndicator()}
        {renderStepContent()}

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.linkText}>← Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: {
    backgroundColor: "#ff6b6b",
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  stepNumberActive: {
    color: "#fff",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: "#ff6b6b",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#2c3e50",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 4,
    color: "#7f8c8d",
  },
  emailText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    color: "#ff6b6b",
    fontWeight: "600",
  },
  input: {
    height: 54,
    borderColor: "#ddd",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#2c3e50",
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    fontWeight: "600",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    height: 54,
    paddingHorizontal: 16,
    color: "#2c3e50",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  linkText: {
    color: "#ff6b6b",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
  },
});
