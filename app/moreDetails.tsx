import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import CustomAlert from "../components/CustomAlert";
import { useAuth } from "../hooks/useAuth";

export default function MoreDetailsScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const params = useLocalSearchParams();

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("Male");
  const [foodType, setFoodType] = useState("Vegetarian");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', buttons?: any[]) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  const name = params.name as string;
  const email = params.email as string;
  const password = params.password as string;
  const phone = params.phone as string;

  const handleSubmit = async () => {
    if (!height || !weight || !address || !pincode) {
      showAlert("Error", "Please fill all details", "warning");
      return;
    }

    setLoading(true);
    try {
      const success = await register(
        name,
        email,
        password,
        phone,
        height,
        weight,
        gender,
        foodType,
        address,
        pincode
      );

      if (success) {
        router.push({
          pathname: "/otpVerification",
          params: { email },
        });
      } else {
        showAlert("Error", "Registration failed. Try again.", "error");
      }
    } catch (err) {
      showAlert("Error", "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>More Details</Text>
        <Text style={styles.subtitle}>Complete your profile</Text>

        <Text>Enter your height (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="Height in cm"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />

        <Text>Enter your weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Weight in kg"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        <Text>Select your gender</Text>
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={gender}
            onValueChange={(val) => setGender(val)}
            style={styles.picker}
          >
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        <Text>Select your food habit</Text>
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={foodType}
            onValueChange={(val) => setFoodType(val)}
            style={styles.picker}
          >
            <Picker.Item label="Vegetarian" value="Vegetarian" />
            <Picker.Item label="Non-Vegetarian" value="Non-Vegetarian" />
            <Picker.Item label="Vegan" value="Vegan" />
            <Picker.Item label="Eggetarian" value="Eggetarian" />
          </Picker>
        </View>

        <Text>Enter your address</Text>
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
          multiline
        />

        <Text>Enter your pincode</Text>
        <TextInput
          style={styles.input}
          placeholder="Pincode"
          keyboardType="numeric"
          value={pincode}
          onChangeText={setPincode}
          maxLength={6}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {loading ? "Submitting..." : "Submit"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  pickerBox: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  picker: {
    color: "#000",
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
