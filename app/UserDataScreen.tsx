import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../hooks/useAuth";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

const COLORS = {
  primary: "#6C63FF",
  secondary: "#4A42E8",
  background: "#f5f5f5",
  cardBackground: "#ffffff",
  textPrimary: "#333",
  textSecondary: "#666",
  border: "#e2e8f0",
  success: "#4CAF50",
  error: "#F44336",
};

const BODY_TYPES = ["Ectomorph", "Mesomorph", "Endomorph"];
const SMOKING_STATUS = ["Non-smoker", "Occasional", "Regular", "Heavy"];
const ALCOHOL_CONSUMPTION = ["None", "Social", "Moderate", "Regular"];
const GENDER_OPTIONS = ["Male", "Female", "Other"];
const WORKOUT_EXPERIENCE = ["Beginner", "Intermediate", "Advanced"];
const JOB_PROFILE = ["Student", "Employee", "Self-employed", "Business person"];
const FOOD_TYPE = ["Vegetarian", "Non-Vegetarian", "Vegan", "Eggetarian"];
const INCOME_OPTIONS = ["Less than 4 LPA", "4-9 LPA", "9+ LPA"];
const PREFERRED_GYM_TIME = ["Early Morning (5-8 AM)", "Morning (8-11 AM)", "Afternoon (12-4 PM)", "Evening (5-8 PM)", "Night (8-11 PM)"];

// Custom Picker Component
interface CustomPickerProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  icon: any;
}

function CustomPicker({ label, value, options, onSelect, icon }: CustomPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        <Ionicons name={icon} size={16} color={COLORS.primary} /> {label}
      </Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerButtonText, !value && styles.placeholderText]}>
          {value || `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
                    value === option && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(option);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      value === option && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {value === option && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function UserDataScreen() {
  const { user, logout } = useAuth();
  const params = useLocalSearchParams();
  const isNewUser = params.isNewUser === "true";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [workoutExperience, setWorkoutExperience] = useState("");
  const [jobProfile, setJobProfile] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [smokingStatus, setSmokingStatus] = useState("");
  const [alcoholConsumption, setAlcoholConsumption] = useState("");
  const [dailyWater, setDailyWater] = useState("");
  const [foodType, setFoodType] = useState("");
  const [foodAllergies, setFoodAllergies] = useState("");
  const [income, setIncome] = useState("");
  const [pastInjury, setPastInjury] = useState("");
  const [preferredGymTime, setPreferredGymTime] = useState("");
  const [profileCompletion, setProfileCompletion] = useState(0);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    const fields = [
      name,
      email,
      phone,
      address,
      pincode,
      gender,
      dob,
      weight,
      height,
      workoutExperience,
      jobProfile,
      bodyType,
      sleepHours,
      smokingStatus,
      alcoholConsumption,
      dailyWater,
      foodType,
      foodAllergies,
      income,
      pastInjury,
      preferredGymTime,
    ];

    const filledFields = fields.filter(field =>
      field !== null && field !== undefined && field !== ""
    ).length;

    return Math.round((filledFields / fields.length) * 100);
  };

  useEffect(() => {
    if (user) {
      console.log("👤 User object:", user);
      console.log("Setting name:", user.name);
      console.log("Setting email:", user.email);
      setName(user.name || "");
      setEmail(user.email || "");
      fetchProfileData();
      fetchUserData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user?._id) return;

    try {
      const response = await fetch(`${API_BASE_URL}auth/profile`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error("Failed to fetch profile, status:", response.status);
        return;
      }

      const data = await response.json();
      console.log("📱 Fetched Profile Data:", data);

      if (data.success && data.user) {
        console.log("📱 User phone number:", data.user.phone);
        // Set phone number, try multiple possible field names
        const phoneValue = data.user.phone || data.user.phoneNumber || "";
        setPhone(phoneValue);
        console.log("✅ Phone number set to:", phoneValue);

        // Set address and pincode from location object
        const addressValue = data.user.location?.address || "";
        const pincodeValue = data.user.location?.pincode || "";
        setAddress(addressValue);
        setPincode(pincodeValue);
        console.log("✅ Address set to:", addressValue);
        console.log("✅ Pincode set to:", pincodeValue);
      } else {
        console.warn("⚠️ Profile data structure unexpected:", data);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    }
  };

  const fetchUserData = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}user-data/${user._id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 404) {
        console.log("📝 No existing profile data found - this is a new profile");
        setIsNewProfile(true);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("📊 Fetched UserData:", data);

      if (data) {
        console.log("✅ Populating form fields with existing data...");
        setGender(data.gender || "");
        setDob(data.dob ? new Date(data.dob).toISOString().split('T')[0] : "");
        setWeight(data.weight?.toString() || "");
        setHeight(data.height?.toString() || "");
        setWorkoutExperience(data.workoutExperience || "");
        setJobProfile(data.jobProfile || "");
        setBodyType(data.bodyType || "");
        setSleepHours(data.sleepHoursPerDay?.toString() || "");
        setSmokingStatus(data.smokingStatus || "");
        setAlcoholConsumption(data.alcoholConsumption || "");
        setDailyWater(data.dailyWaterIntake?.toString() || "");
        setFoodType(data.foodType || "");
        setFoodAllergies(data.foodAllergies || "");
        setIncome(data.income || "");
        setPastInjury(data.pastInjury || "");
        setPreferredGymTime(data.preferredGymTime || "");

        console.log("✅ Form fields populated successfully");
        console.log("Current values:", {
          gender: data.gender,
          weight: data.weight,
          height: data.height,
          bodyType: data.bodyType
        });
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // Don't alert on 404, just let them create
    } finally {
      setLoading(false);
      // Calculate profile completion after loading data
      setTimeout(() => setProfileCompletion(calculateProfileCompletion()), 100);
    }
  };

  // Recalculate profile completion whenever any field changes
  useEffect(() => {
    setProfileCompletion(calculateProfileCompletion());
  }, [name, email, phone, address, pincode, gender, dob, weight, height, workoutExperience, jobProfile,
    bodyType, sleepHours, smokingStatus, alcoholConsumption, dailyWater, foodType, foodAllergies, income, pastInjury, preferredGymTime]);

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your name");
      return;
    }

    if (sleepHours && (isNaN(Number(sleepHours)) || Number(sleepHours) < 0 || Number(sleepHours) > 24)) {
      Alert.alert("Validation Error", "Sleep hours must be between 0 and 24");
      return;
    }

    if (dailyWater && (isNaN(Number(dailyWater)) || Number(dailyWater) < 0)) {
      Alert.alert("Validation Error", "Daily water intake must be a positive number");
      return;
    }

    if (weight && (isNaN(Number(weight)) || Number(weight) < 0)) {
      Alert.alert("Validation Error", "Weight must be a positive number");
      return;
    }

    if (height && (isNaN(Number(height)) || Number(height) < 0)) {
      Alert.alert("Validation Error", "Height must be a positive number");
      return;
    }

    try {
      setSaving(true);

      if (!user?._id) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // Update user profile (name, phone, address, pincode) if changed
      if (name !== user.name || phone !== (user as any)?.phone || address || pincode) {
        try {
          // Update user profile (name, phone, address, pincode)
          const userUpdateResponse = await fetch(`${API_BASE_URL}auth/profile`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name,
              phone: phone || undefined,
              address: address || undefined,
              pincode: pincode || undefined,
            }),
          });

          if (userUpdateResponse.ok) {
            const userUpdateData = await userUpdateResponse.json();
            console.log("✅ User profile updated successfully:", userUpdateData);
          } else {
            const errorData = await userUpdateResponse.json();
            console.warn("⚠️ User profile update failed:", errorData);
            // Continue with fitness data update even if user update fails
          }
        } catch (userUpdateError: any) {
          console.warn("⚠️ Could not update user profile:", userUpdateError);
          // Continue with fitness data update even if user update fails
        }
      }

      // Prepare update payload for fitness data
      const updatePayload: any = {
        userId: user._id,
        gender: gender || undefined,
        dob: dob || undefined,
        weight: weight ? Number(weight) : undefined,
        height: height ? Number(height) : undefined,
        location: "Unknown", // TODO: Add location picker
        workoutExperience: workoutExperience || undefined,
        jobProfile: jobProfile || undefined,
        bodyType: bodyType || undefined,
        sleepHoursPerDay: sleepHours ? Number(sleepHours) : undefined,
        smokingStatus: smokingStatus || undefined,
        alcoholConsumption: alcoholConsumption || undefined,
        dailyWaterIntake: dailyWater ? Number(dailyWater) : undefined,
        foodType: foodType || undefined,
        foodAllergies: foodAllergies.trim() || undefined,
        income: income || undefined,
        pastInjury: pastInjury.trim() || undefined,
        preferredGymTime: preferredGymTime || undefined,
      };

      const url = `${API_BASE_URL}user-data/${user._id}`;
      const method = isNewProfile ? "POST" : "PUT";

      console.log(`${method}ing profile to ${url}`, updatePayload);

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => router.replace("/(tabs)") },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (isNewUser) {
              logout();
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name={isNewUser ? "log-out-outline" : "arrow-back"} size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Update Profile</Text>
          <View style={styles.completionBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.completionText}>{profileCompletion}% Complete</Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="person" size={16} color={COLORS.primary} /> Name *
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="mail" size={16} color={COLORS.primary} /> Email
            </Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <CustomPicker
            label="Gender"
            value={gender}
            options={GENDER_OPTIONS}
            onSelect={setGender}
            icon="male-female"
          />

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} /> Date of Birth
            </Text>
            <TextInput
              style={styles.input}
              value={dob}
              onChangeText={setDob}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 1995-06-15)</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="phone-portrait" size={16} color={COLORS.primary} /> Phone Number
            </Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.helperText}>Enter your phone number</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="location" size={16} color={COLORS.primary} /> Address
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.helperText}>Enter your complete address</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="pin" size={16} color={COLORS.primary} /> Pincode
            </Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={setPincode}
              placeholder="Enter pincode"
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.helperText}>Enter 6-digit pincode</Text>
          </View>
        </View>

        {/* Physical Profile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="body" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Physical Profile</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="barbell" size={16} color={COLORS.primary} /> Weight (kg)
            </Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g., 70"
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="resize" size={16} color={COLORS.primary} /> Height (cm)
            </Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="e.g., 175"
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <CustomPicker
            label="Body Type"
            value={bodyType}
            options={BODY_TYPES}
            onSelect={setBodyType}
            icon="body"
          />

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="bed" size={16} color={COLORS.primary} /> Sleep Hours Per Day
            </Text>
            <TextInput
              style={styles.input}
              value={sleepHours}
              onChangeText={setSleepHours}
              placeholder="e.g., 7.5"
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <CustomPicker
            label="Workout Experience"
            value={workoutExperience}
            options={WORKOUT_EXPERIENCE}
            onSelect={setWorkoutExperience}
            icon="fitness"
          />

          <CustomPicker
            label="Job Profile"
            value={jobProfile}
            options={JOB_PROFILE}
            onSelect={setJobProfile}
            icon="briefcase"
          />
        </View>

        {/* Lifestyle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="fitness" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Lifestyle Habits</Text>
          </View>

          <CustomPicker
            label="Smoking Status"
            value={smokingStatus}
            options={SMOKING_STATUS}
            onSelect={setSmokingStatus}
            icon="warning"
          />

          <CustomPicker
            label="Alcohol Consumption"
            value={alcoholConsumption}
            options={ALCOHOL_CONSUMPTION}
            onSelect={setAlcoholConsumption}
            icon="wine"
          />
        </View>

        {/* Fitness Goals & Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Fitness Goals & Preferences</Text>
          </View>

          <CustomPicker
            label="Income Range"
            value={income}
            options={INCOME_OPTIONS}
            onSelect={setIncome}
            icon="cash"
          />

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="medkit" size={16} color={COLORS.primary} /> Past Injury
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={pastInjury}
              onChangeText={setPastInjury}
              placeholder="Describe any past injuries (optional)"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.helperText}>Help us understand your injury history</Text>
          </View>

          <CustomPicker
            label="Preferred Gym Time"
            value={preferredGymTime}
            options={PREFERRED_GYM_TIME}
            onSelect={setPreferredGymTime}
            icon="time"
          />
        </View>

        {/* Nutrition & Health */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="nutrition" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Nutrition & Health</Text>
          </View>

          <CustomPicker
            label="Food Type"
            value={foodType}
            options={FOOD_TYPE}
            onSelect={setFoodType}
            icon="restaurant"
          />

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="water" size={16} color={COLORS.primary} /> Daily Water Intake (Liters)
            </Text>
            <TextInput
              style={styles.input}
              value={dailyWater}
              onChangeText={setDailyWater}
              placeholder="e.g., 2.5"
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Ionicons name="warning" size={16} color={COLORS.primary} /> Food Allergies
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={foodAllergies}
              onChangeText={setFoodAllergies}
              placeholder="List any food allergies (e.g., Peanuts, Shellfish)"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  completionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  completionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  disabledInput: {
    backgroundColor: "#f9f9f9",
    color: COLORS.textSecondary,
  },
  textArea: {
    height: 90,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontStyle: "italic",
  },
  pickerButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerButtonText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  modalScroll: {
    paddingHorizontal: 16,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalOptionSelected: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 8,
    borderBottomColor: "transparent",
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },
});