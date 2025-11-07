import { useEffect, useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Consistent color scheme
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
  accent: "#ff6b6b",
};

export default function ProfileScreen() {
  const { logout, user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const deleteAccount = async () => {
    const data = await AsyncStorage.getItem("userInfo");
    if (data) {
      const userData = JSON.parse(data);
      const email = "support@gymshood.com";
      const subject = "Delete GymsHood User Account";
      const body = `Hi,\nKindly delete my account with User ID ${userData._id}`;

      const mailtoURL = `mailto:${email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      Linking.openURL(mailtoURL).catch((err) => {
        console.error("Failed to open email client:", err);
      });
    } else {
      return;
    }
  };
  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProfile();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="warning" size={48} color={COLORS.error} />
        <Text style={styles.emptyText}>Failed to load profile data</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchProfile();
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.headerName}>{userData.name}</Text>
          <Text style={styles.headerEmail}>{userData.email}</Text>
        </LinearGradient>

        {/* Account Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Account Details</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={COLORS.primary}
            />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Role</Text>
              <Text style={styles.detailValue}>{userData.role}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name={
                userData.accountVerified ? "checkmark-circle" : "close-circle"
              }
              size={20}
              color={userData.accountVerified ? COLORS.success : COLORS.error}
            />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Account Status</Text>
              <Text style={styles.detailValue}>
                {userData.accountVerified ? "Verified" : "Not Verified"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => {
              // Navigate to update-profile page
              // You can pass userData as params if needed
              router.push("/UserDataScreen");
            }}
          >
            <Ionicons name="create" size={22} color="#fff" />
            <Text style={styles.updateButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="key" size={20} color={COLORS.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Authentication</Text>
              <Text style={styles.detailValue}>
                {userData.isPwdAuth ? "Password" : "Other Method"}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Password Setup Attempts</Text>
              <Text style={styles.detailValue}>
                {userData.pwdSetupAttempts.count}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="help-circle" size={20} color={COLORS.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Forgot Password Attempts</Text>
              <Text style={styles.detailValue}>
                {userData.forgotPasswordAttempts}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Account Activity</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Account Created</Text>
              <Text style={styles.detailValue}>
                {formatDate(userData.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="refresh-circle" size={20} color={COLORS.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Last Updated</Text>
              <Text style={styles.detailValue}>
                {formatDate(userData.updatedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        {/* Logout Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={deleteAccount}>
          <Ionicons name="trash" size={24} color="#a00" />
          <Text style={styles.deleteButtonText}>Request Account Deletion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  updateButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    padding: 30,
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  headerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: COLORS.textPrimary,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailText: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: "#a00",
    fontSize: 16,
    fontWeight: "400",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.accent,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
});
