import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";


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

// const { user } = useAuth();


// Fetch with timeout utility
const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Profile Completion Bar Component
function ProfileCompletionBar({ progress = 0, onPress }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolated = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <TouchableOpacity
      style={styles.profileBarCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.profileBarHeader}>
        <View style={styles.profileBarIconContainer}>
          <Ionicons name="person-circle" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.profileBarTextContainer}>
          <Text style={styles.profileBarTitle}>Profile Completion</Text>
          <Text style={styles.profileBarSubtitle}>
            {progress === 100 ? "Your profile is complete!" : "Complete your profile to unlock features"}
          </Text>
        </View>
        <Text style={styles.profileBarPercentage}>{`${progress}%`}</Text>
      </View>

      <View style={styles.profileBarBackground}>
        <Animated.View
          style={[
            styles.profileBarFill,
            { width: widthInterpolated },
          ]}
        />
      </View>

      {progress < 100 && (
        <View style={styles.profileBarFooter}>
          <Text style={styles.profileBarAction}>Tap to complete your profile</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// Announcement Carousel
function AnnouncementCarousel({ announcements = [] }) {
  const { width } = useWindowDimensions();
  const flatRef = useRef(null);
  const autoScrollTimer = useRef(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [announcements]);

  useEffect(() => {
    if (!announcements || announcements.length === 0) return;
    startAutoScroll();
    return () => stopAutoScroll();
  }, [announcements]);

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollTimer.current = setInterval(() => {
      let nextIndex = indexRef.current + 1;
      if (nextIndex >= announcements.length) nextIndex = 0;
      indexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      flatRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 4000);
  };

  const stopAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };

  const onTouchStart = () => stopAutoScroll();
  const onTouchEnd = () => startAutoScroll();

  const renderItem = ({ item }) => (
    <Animated.View style={[styles.carouselCard, { width: width - 64 }]}>
      <LinearGradient
        colors={["#A18CD1", "#FBC2EB"]}
        style={styles.carouselGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.announcementLeftBorder} />
        <View style={styles.carouselContent}>
          <View style={styles.announcementHeader}>
            <View style={styles.announcementGymContainer}>
              <View style={styles.gymIconBadge}>
                <Ionicons name="business" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.announcementGym}>{item.gymId?.name || "Gym"}</Text>
            </View>
            <Text style={styles.announcementDate}>
              {new Date(item.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <Text numberOfLines={3} style={styles.announcementMessageLarge}>
            {item.message}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <FlatList
          ref={flatRef}
          data={announcements}
          keyExtractor={(item, idx) => `${item._id || idx}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          decelerationRate="fast"
          bounces
          contentContainerStyle={{ paddingHorizontal: 32 }}
          renderItem={renderItem}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMomentumScrollEnd={(ev) => {
            const newIndex = Math.round(ev.nativeEvent.contentOffset.x / (width - 64));
            indexRef.current = newIndex;
            setActiveIndex(newIndex);
          }}
        />
        <View style={styles.dotsRow}>
          {announcements.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// HomeScreen Component
export default function HomeScreen() {
  const { user } = useAuth();

  const [gymData, setGymData] = useState([]);
  const [gymDataLoading, setGymDataLoading] = useState(true);
  const [gymDataError, setGymDataError] = useState(null);

  const [streakData, setStreakData] = useState(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [streakError, setStreakError] = useState(null);

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(null);

  const [profileCompletion, setProfileCompletion] = useState(0);

  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [fitnessData, setFitnessData] = useState(null);


  const calculateProfileCompletion = (userData, fitnessData) => {
    if (!userData) return 0;

    const fields = [
      // Basic info (matching UserDataScreen calculation)
      userData.name,
      userData.email,
      userData.phone,
      userData.location?.address,
      userData.location?.pincode,
      // Fitness profile fields (from separate UserData model)
      // Note: field names match what comes from the API
      fitnessData?.gender,
      fitnessData?.dob,
      fitnessData?.weight,
      fitnessData?.height,
      fitnessData?.workoutExperience,
      fitnessData?.jobProfile,
      fitnessData?.bodyType,
      fitnessData?.sleepHoursPerDay,
      fitnessData?.smokingStatus,
      fitnessData?.alcoholConsumption,
      fitnessData?.dailyWaterIntake,
      fitnessData?.foodType,
      fitnessData?.foodAllergies,
      // New fields
      fitnessData?.income,
      fitnessData?.pastInjury,
      fitnessData?.preferredGymTime,
    ];

    const filledFields = fields.filter(field =>
      field !== null && field !== undefined && field !== ""
    ).length;

    return Math.round((filledFields / fields.length) * 100);
  };

  const fetchGymData = async () => {
    try {
      setGymDataLoading(true);
      setGymDataError(null);

      const response = await fetchWithTimeout(`${API_BASE_URL}gymdb/user/yearly-data`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) setGymData(data.data);
      else setGymDataError(data.message || "Failed to fetch gym data");
    } catch (error) {
      console.error("Gym data error:", error);
      setGymDataError(error.name === "AbortError" ? "Request timed out." : "Unable to load data");
    } finally {
      setGymDataLoading(false);
    }
  };

  const fetchStreakData = async () => {
    try {
      setStreakLoading(true);
      setStreakError(null);

      const response = await fetchWithTimeout(`${API_BASE_URL}gymdb/userStreak`, { method: "GET" });
      const data = await response.json();
      if (data.success) setStreakData(data);
      else setStreakError(data.message || "Failed to fetch streak data");
    } catch (error) {
      console.error("Streak data error:", error);
      setStreakError(error.name === "AbortError" ? "Request timed out." : "Unable to load data");
    } finally {
      setStreakLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      setAnnouncementsError(null);

      const response = await fetchWithTimeout(`${API_BASE_URL}gymdb/announcements/gym`, { method: "GET" });
      const data = await response.json();
      if (data.success) setAnnouncements(data.announcements);
      else setAnnouncementsError(data.message || "Failed to fetch announcements");
    } catch (error) {
      console.error("Announcements error:", error);
      setAnnouncementsError(error.name === "AbortError" ? "Request timed out." : "Unable to load announcements");
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}auth/profile`, { method: "GET" });
      const data = await response.json();
      if (data.success) {
        setProfileData(data.user);
        // Fetch fitness profile data separately and pass user data
        await fetchFitnessData(data.user._id, data.user);
      }
    } catch (error) {
      console.error("Profile data error:", error);
    }
  };

  const fetchFitnessData = async (userId, userData) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}user-data/${userId}`, { method: "GET" });
      if (response.status === 404) {
        // No fitness data yet
        setFitnessData(null);
        // Calculate with just user data
        const completion = calculateProfileCompletion(userData, null);
        setProfileCompletion(completion);
        return;
      }
      const data = await response.json();
      setFitnessData(data);
      // Calculate completion with both user and fitness data
      const completion = calculateProfileCompletion(userData, data);
      setProfileCompletion(completion);
    } catch (error) {
      console.error("Fitness data error:", error);
      // Calculate with just user data if fitness data fetch fails
      const completion = calculateProfileCompletion(userData, null);
      setProfileCompletion(completion);
    }
  };

  const fetchData = async () => {
    await Promise.all([
      fetchGymData(),
      fetchStreakData(),
      fetchAnnouncements(),
      fetchProfileData()
    ]);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const retryFetch = (fn) => fn();

  const totalLoggedDays = gymData?.dateArray?.filter((d) => d === 1).length || 0;
  const latestEntry = gymData?.length ? gymData[gymData.length - 1] : null;

  const ErrorCard = ({ error, onRetry, title }) => (
    <View style={styles.errorCard}>
      <View style={styles.errorIconContainer}><Ionicons name="warning" size={28} color={COLORS.error} /></View>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={16} color="#fff" style={styles.retryIcon} />
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerContent}>
            <View style={styles.avatar}><Ionicons name="fitness" size={44} color="#fff" /></View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>
                {profileData?.name ? profileData.name : "User!"}
              </Text>
              <Text style={styles.headerEmail}>Your Fitness Journey</Text>
              {/* console.log(userData.name); */}
            </View>
          </View>
        </LinearGradient>



        {/* Profile Completion Bar */}
        <View style={styles.profileCompletionContainer}>
          <ProfileCompletionBar
            progress={profileCompletion}
            onPress={() => router.push("/profile")}
          />
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionIconBadge}><Ionicons name="megaphone" size={20} color={COLORS.primary} /></View>
            <Text style={styles.sectionTitle}>Gym Announcements</Text>
          </View>

          {announcementsLoading ? <LoadingCard title="announcements" /> :
            announcementsError ? <ErrorCard error={announcementsError} title="Announcements" onRetry={() => retryFetch(fetchAnnouncements)} /> :
              announcements.length > 0 ? <AnnouncementCarousel announcements={announcements} /> :
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="notifications-off-outline" size={48} color={COLORS.border} />
                  <Text style={styles.noDataText}>No announcements available</Text>
                </View>
          }
        </View>

        <View style={styles.content}>
          {/* Activity Stats */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <View style={styles.sectionIconBadge}><Ionicons name="bar-chart" size={20} color={COLORS.primary} /></View>
              <Text style={styles.sectionTitle}>Your Activity</Text>
            </View>

            {gymDataLoading ? <LoadingCard title="activity data" /> :
              gymDataError ? <ErrorCard error={gymDataError} title="Activity Data" onRetry={() => retryFetch(fetchGymData)} /> :
                <View style={styles.statsRow}>
                  <View style={[styles.statCard, { borderRadius: 15, padding: 15, backgroundColor: '#fff', elevation: 5 }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#E0F7FA', borderRadius: 50, padding: 10 }]}>
                      <Ionicons name="calendar" size={28} color={COLORS.primary} />
                    </View>
                    <Text style={styles.statLabel}>Active Days</Text>
                    <Text style={[styles.statValue, { fontSize: 32, fontWeight: 'bold', color: COLORS.primary }]}>{totalLoggedDays}</Text>
                    <Text style={styles.statSubtext}>This Year</Text>
                  </View>

                  {latestEntry && (
                    <View style={styles.statCard}>
                      <View style={styles.statIconContainer}><Ionicons name="time" size={28} color={COLORS.primary} /></View>
                      <Text style={styles.statLabel}>Last Active</Text>
                      <Text style={styles.statValue}>{new Date(latestEntry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
                      <Text style={styles.statSubtext}>Recent Visit</Text>
                    </View>
                  )}
                </View>
            }
          </View>

          {/* Streaks */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <View style={styles.sectionIconBadge}><Ionicons name="flame" size={20} color={COLORS.primary} /></View>
              <Text style={styles.sectionTitle}>Your Streaks</Text>
            </View>

            {streakLoading ? <LoadingCard title="streak data" /> :
              streakError ? <ErrorCard error={streakError} title="Streak Data" onRetry={() => retryFetch(fetchStreakData)} /> :
                streakData ? <View style={styles.statsRow}>
                  <View style={[styles.statCard, styles.streakCard]}>
                    <View style={[styles.statIconContainer, styles.streakIconContainer]}><Ionicons name="flame" size={32} color="#FF6B35" /></View>
                    <Text style={styles.statLabel}>Current Streak</Text>
                    <Text style={[styles.statValue, styles.streakValue]}>{streakData.currentStreak}</Text>
                    <Text style={styles.statSubtext}>Days in a row</Text>
                  </View>
                  <View style={styles.statCard}>
                    <View style={styles.statIconContainer}><Ionicons name="trending-up" size={28} color={COLORS.primary} /></View>
                    <Text style={styles.statLabel}>This Week</Text>
                    <Text style={styles.statValue}>{streakData.thisWeekStreak}</Text>
                    <Text style={styles.statSubtext}>Days active</Text>
                  </View>
                </View> : <Text style={styles.noDataText}>No streak data available</Text>
            }
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContainer: { flexGrow: 1, paddingBottom: 20 },
  header: { padding: 24, paddingTop: 48, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255, 255, 255, 0.25)", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "rgba(255, 255, 255, 0.3)" },
  headerTextContainer: { flex: 1, marginLeft: 16 },
  headerGreeting: { fontSize: 14, color: "rgba(255, 255, 255, 0.85)", marginBottom: 2, letterSpacing: 0.3 },
  headerName: { fontSize: 26, fontWeight: "bold", color: "#fff", marginBottom: 4, letterSpacing: 0.5 },
  headerEmail: { fontSize: 13, color: "rgba(255, 255, 255, 0.75)", letterSpacing: 0.2 },

  profileCompletionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  profileBarCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  profileBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileBarIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileBarTextContainer: {
    flex: 1,
  },
  profileBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileBarSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  profileBarPercentage: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  profileBarBackground: {
    height: 10,
    borderRadius: 5,
    backgroundColor: `${COLORS.primary}20`,
    overflow: "hidden",
  },
  profileBarFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  profileBarFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  profileBarAction: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    marginRight: 4,
  },

  content: { paddingTop: 8 },
  section: { backgroundColor: COLORS.cardBackground, marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  sectionHeaderContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  sectionIconBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${COLORS.primary}15`, justifyContent: "center", alignItems: "center", marginRight: 12 },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: COLORS.textPrimary, letterSpacing: 0.3 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statCard: { backgroundColor: COLORS.cardBackground, borderRadius: 14, padding: 18, width: "48%", alignItems: "center", borderWidth: 1.5, borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  streakCard: { borderColor: "#FF6B3520", backgroundColor: "#FF6B3505" },
  statIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${COLORS.primary}12`, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  streakIconContainer: { backgroundColor: "#FF6B3515" },
  statLabel: { fontSize: 13, color: COLORS.textSecondary },
  statValue: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, marginVertical: 2 },
  streakValue: { color: "#FF6B35" },
  statSubtext: { fontSize: 11, color: COLORS.textSecondary },
  noDataText: { textAlign: "center", fontSize: 14, color: COLORS.textSecondary, marginTop: 16 },
  loadingCard: { padding: 20, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 13, color: COLORS.textSecondary },
  errorCard: { padding: 20, alignItems: "center" },
  errorIconContainer: { marginBottom: 12 },
  errorTitle: { fontWeight: "600", fontSize: 16, color: COLORS.error, marginBottom: 4 },
  errorMessage: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginBottom: 12 },
  retryButton: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12 },
  retryIcon: { marginRight: 6 },
  retryButtonText: { color: "#fff", fontWeight: "600" },
  emptyStateContainer: { padding: 20, justifyContent: "center", alignItems: "center" },

  carouselCard: { marginHorizontal: 8, borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  carouselGradient: { flex: 1, padding: 20, borderRadius: 18 },
  carouselContent: { flex: 1 },
  announcementLeftBorder: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5, backgroundColor: COLORS.primary, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  announcementHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  announcementGymContainer: { flexDirection: "row", alignItems: "center" },
  gymIconBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginRight: 6 },
  announcementGym: { fontSize: 14, fontWeight: "600", color: "#fff" },
  announcementDate: { fontSize: 11, color: "#fff", opacity: 0.85 },
  announcementMessageLarge: { fontSize: 15, color: "#fff", fontWeight: "500", marginBottom: 8 },
  dotsRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  dotActive: { backgroundColor: COLORS.primary },
  dotInactive: { backgroundColor: COLORS.border },
});