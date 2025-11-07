import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

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
  accent: "#ff6b6b",
};

// Utility function to create fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export default function HomeScreen() {
  const { user } = useAuth();
  
  // Separate loading states for different data sections
  const [gymData, setGymData] = useState([]);
  const [gymDataLoading, setGymDataLoading] = useState(true);
  const [gymDataError, setGymDataError] = useState(null);
  
  const [streakData, setStreakData] = useState(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [streakError, setStreakError] = useState(null);
  
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(null);
  
  const [refreshing, setRefreshing] = useState(false);

  const fetchGymData = async () => {
    try {
      setGymDataLoading(true);
      setGymDataError(null);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}gymdb/user/yearly-data`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }, 10000); // 10 second timeout

      const data = await response.json();
      if (data.success) {
        setGymData(data.data);
      } else {
        setGymDataError(data.message || "Failed to fetch gym data");
      }
    } catch (error) {
      console.error("Error fetching gym data:", error);
      if (error.name === 'AbortError') {
        setGymDataError("Request timed out. Please check your connection.");
      } else {
        setGymDataError("Unable to load your activity data");
      }
    } finally {
      setGymDataLoading(false);
    }
  };

  const fetchStreakData = async () => {
    try {
      setStreakLoading(true);
      setStreakError(null);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}gymdb/userStreak`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }, 10000);

      const data = await response.json();
      if (data.success) {
        setStreakData(data);
      } else {
        setStreakError(data.message || "Failed to fetch streak data");
      }
    } catch (error) {
      console.error("Error fetching streak data:", error);
      if (error.name === 'AbortError') {
        setStreakError("Request timed out. Please check your connection.");
      } else {
        setStreakError("Unable to load streak data");
      }
    } finally {
      setStreakLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      setAnnouncementsError(null);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}gymdb/announcements/gym`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }, 10000);

      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      } else {
        setAnnouncementsError(data.message || "Failed to fetch announcements");
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      if (error.name === 'AbortError') {
        setAnnouncementsError("Request timed out. Please check your connection.");
      } else {
        setAnnouncementsError("Unable to load announcements");
      }
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const fetchData = async () => {
    // Fetch data independently - don't wait for all to complete
    Promise.all([
      fetchGymData(),
      fetchStreakData(), 
      fetchAnnouncements(),
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const retryFetch = (fetchFunction) => {
    fetchFunction();
  };

  const totalLoggedDays = gymData
    ? gymData.dateArray?.filter((d) => d === 1).length
    : 0;
  const latestEntry =
    gymData && gymData.length > 0 ? gymData[gymData.length - 1] : null;

  // Error component
  const ErrorCard = ({ error, onRetry, title }) => (
    <View style={styles.errorCard}>
      <Ionicons name="warning" size={24} color={COLORS.error} />
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading component
  const LoadingCard = ({ title }) => (
    <View style={styles.loadingCard}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      <Text style={styles.loadingText}>Loading {title}...</Text>
    </View>
  );

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
            <Ionicons name="fitness" size={40} color="#fff" />
          </View>
          <Text style={styles.headerName}>
            Welcome, {user?.name || "User"}!
          </Text>
          <Text style={styles.headerEmail}>Your Gymshood Dashboard</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Stats Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            
            {gymDataLoading ? (
              <LoadingCard title="activity data" />
            ) : gymDataError ? (
              <ErrorCard
                error={gymDataError}
                title="Activity Data"
                onRetry={() => retryFetch(fetchGymData)}
              />
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Ionicons name="calendar" size={24} color={COLORS.primary} />
                  <Text style={styles.statLabel}>Active Days</Text>
                  <Text style={styles.statValue}>{totalLoggedDays}</Text>
                </View>

                {latestEntry && (
                  <View style={styles.statCard}>
                    <Ionicons name="time" size={24} color={COLORS.primary} />
                    <Text style={styles.statLabel}>Last Active</Text>
                    <Text style={styles.statValue}>
                      {new Date(latestEntry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Streak Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Streaks</Text>
            
            {streakLoading ? (
              <LoadingCard title="streak data" />
            ) : streakError ? (
              <ErrorCard
                error={streakError}
                title="Streak Data"
                onRetry={() => retryFetch(fetchStreakData)}
              />
            ) : streakData ? (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="flame" size={24} color={COLORS.primary} />
                  <Text style={styles.statLabel}>Current Streak</Text>
                  <Text style={styles.statValue}>
                    {streakData.currentStreak} days
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons
                    name="trending-up"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text style={styles.statLabel}>This Week</Text>
                  <Text style={styles.statValue}>
                    {streakData.thisWeekStreak} days
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noDataText}>No streak data available</Text>
            )}
          </View>

          {/* Announcements Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="megaphone" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Gym Announcements</Text>
            </View>
            
            {announcementsLoading ? (
              <LoadingCard title="announcements" />
            ) : announcementsError ? (
              <ErrorCard
                error={announcementsError}
                title="Announcements"
                onRetry={() => retryFetch(fetchAnnouncements)}
              />
            ) : announcements.length > 0 ? (
              <View style={styles.announcementsContainer}>
                {announcements.map((announcement, index) => (
                  <View key={index} style={styles.announcementCard}>
                    <View style={styles.announcementHeader}>
                      <Ionicons
                        name="business"
                        size={16}
                        color={COLORS.primary}
                      />
                      <Text style={styles.announcementGym}>
                        {announcement.gymId?.name || "Gym"}
                      </Text>
                      <Text style={styles.announcementDate}>
                        {new Date(announcement.createdAt).toLocaleString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )}
                      </Text>
                    </View>
                    <Text style={styles.announcementMessage}>
                      {announcement.message}
                    </Text>
                    {index < announcements.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No announcements available</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
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
    borderRadius: 35,
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
  content: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    margin: 15,
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: COLORS.textPrimary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 15,
    width: "48%",
    marginBottom: 15,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  announcementsContainer: {
    marginTop: 10,
  },
  announcementCard: {
    marginBottom: 15,
    paddingBottom: 15,
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  announcementGym: {
    flex: 1,
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 8,
    color: COLORS.primary,
  },
  announcementDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    paddingLeft: 10,
  },
  announcementMessage: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    paddingLeft: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 15,
  },
  
  // New styles for improved loading/error states
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorCard: {
    alignItems: "center",
    paddingVertical: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.error,
    marginTop: 8,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noDataText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingVertical: 20,
  },
});