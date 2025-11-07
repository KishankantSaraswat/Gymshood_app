import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

interface UserData {
  gender: string;
  dob: string;
  weight: string;
  height: string;
  location: string;
  workoutExperience: string;
  jobProfile: string;
  userId: string;
}

export default function UserDataScreen() {
  const router = useRouter();

  const [formData, setFormData] = useState<UserData>({
    gender: "",
    dob: "",
    weight: "",
    height: "",
    location: "",
    workoutExperience: "",
    jobProfile: "",
    userId: "",
  });

  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (key: keyof UserData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const {
      gender,
      dob,
      weight,
      height,
      location,
      workoutExperience,
      jobProfile,
    } = formData;
  
    if (
      !gender ||
      !dob ||
      !weight ||
      !height ||
      !location ||
      !workoutExperience ||
      !jobProfile
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
  
    try {
      const userInfo = await AsyncStorage.getItem("userInfo");
      if (!userInfo) throw new Error("User info not found");
  
      const user = JSON.parse(userInfo);
      const userId = user._id || user.userId || user.id;
      if (!userId) throw new Error("User ID missing");
  
      formData.userId = userId;
  
      // 🔍 First check if user data already exists
      const checkRes = await fetch(`${API_BASE_URL}user-data/${userId}`);
      const method = checkRes.status === 404 ? "POST" : "PUT";
  
      // 📤 Submit via POST or PUT
      const response = await fetch(`${API_BASE_URL}user-data/${userId}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || "Submission failed");
  
      Alert.alert("Success", "User data submitted successfully");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Submit error:", error.message);
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tell Us About Yourself</Text>
      <Text style={styles.label}>Gender</Text>
      <Picker
        selectedValue={formData.gender}
        onValueChange={(value) =>
          handleChange("gender", value.toString())
        }
        style={styles.picker}
      >
        <Picker.Item label="Select gender" value="" />
        <Picker.Item label="Male" value="Male" />
        <Picker.Item label="Female" value="Female" />
        <Picker.Item label="Other" value="Other" />
      </Picker>

      

      <Text style={styles.label}>Date of Birth</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: formData.dob ? "#000" : "#555" }}>
          {formData.dob || "Select Date"}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          mode="date"
          value={dobDate || new Date("2000-01-01")}
          display="default"
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDobDate(selectedDate);
              const isoDate = selectedDate.toISOString().split("T")[0];
              handleChange("dob", isoDate);
            }
          }}
        />
      )}

      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput
        style={styles.input}
        placeholder="70"
        keyboardType="numeric"
        value={formData.weight}
        onChangeText={(text) => handleChange("weight", text)}
      />

      <Text style={styles.label}>Height (cm)</Text>
      <TextInput
        style={styles.input}
        placeholder="175"
        keyboardType="numeric"
        value={formData.height}
        onChangeText={(text) => handleChange("height", text)}
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        placeholder="City, Country"
        value={formData.location}
        onChangeText={(text) => handleChange("location", text)}
      />

      <Text style={styles.label}>Workout Experience</Text>
      <Picker
        selectedValue={formData.workoutExperience}
        onValueChange={(value) =>
          handleChange("workoutExperience", value.toString())
        }
        style={styles.picker}
      >
        <Picker.Item label="Select experience" value="" />
        <Picker.Item label="Beginner" value="Beginner" />
        <Picker.Item label="Intermediate" value="Intermediate" />
        <Picker.Item label="Advanced" value="Advanced" />
      </Picker>

      <Text style={styles.label}>Job Profile</Text>
      <Picker
        selectedValue={formData.jobProfile}
        onValueChange={(value) => handleChange("jobProfile", value.toString())}
        style={styles.picker}
      >
        <Picker.Item label="Select job profile" value="" />
        <Picker.Item label="Student" value="Student" />
        <Picker.Item label="Employee" value="Employee" />
        <Picker.Item label="Self-employed" value="Self-employed" />
        <Picker.Item label="Business person" value="Business person" />
      </Picker>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  label: {
    marginBottom: 4,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
    color:"#000",
  },
  picker: {
    height: 50,
    backgroundColor: "#fff",
    marginBottom: 15,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    color:"#000",
  },
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
