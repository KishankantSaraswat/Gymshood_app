import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { fixUrl } from "../utils/imageHelper";
import CustomAlert from "./CustomAlert";

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

interface Gym {
  _id: string;
  name: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  about: string;
  openTime: string;
  closeTime: string;
  media?: {
    logoUrl?: string;
    mediaUrls?: string[];
    frontPhotoUrl?: string;
  };
  avgRating?: number;
  verified?: boolean;
}

interface GymSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onGymSelected: (gym: Gym) => void;
}

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function convertTo12Hour(time24: string) {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr.padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

export default function GymSelectionModal({ visible, onClose, onGymSelected }: GymSelectionModalProps) {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

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

  const fetchData = async () => {
    try {
      await Promise.all([fetchGyms(), getUserLocation()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGyms = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}gymdb/gyms`);
      const data = await res.json();
      if (data.success) {
        // Filter only verified gyms
        const verifiedGyms = data.gyms.filter((gym: Gym) => gym.verified !== false);
        setGyms(verifiedGyms);
      }
    } catch (error) {
      console.error("Error fetching gyms:", error);
    }
  };

  const getUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchData();
    }
  }, [visible]);

  const sortedGyms = gyms
    .filter((gym) => gym.verified !== false)
    .sort((a, b) => {
      if (!userLocation) return 0;

      const [lonA, latA] = a.location.coordinates;
      const [lonB, latB] = b.location.coordinates;

      const distanceA = getDistance(
        userLocation.latitude,
        userLocation.longitude,
        latA,
        lonA
      );

      const distanceB = getDistance(
        userLocation.latitude,
        userLocation.longitude,
        latB,
        lonB
      );

      return distanceA - distanceB; // Sort by ascending distance
    });

  const handleGymSelection = async (gym: Gym) => {
    try {
      // Save selected gym to AsyncStorage
      await AsyncStorage.setItem("selectedGym", JSON.stringify({
        id: gym._id,
        name: gym.name,
        address: gym.location.address,
        logoUrl: gym.media?.logoUrl || gym.media?.frontPhotoUrl
      }));

      onGymSelected(gym);
      onClose();
    } catch (error) {
      console.error("Error saving gym selection:", error);
      showAlert("Error", "Failed to save gym selection. Please try again.", "error");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="fitness" size={32} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Select Your Gym</Text>
            <Text style={styles.headerSubtitle}>
              Choose a verified gym near you
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Gym List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loaderText}>Finding nearby gyms...</Text>
            </View>
          ) : sortedGyms.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="sad-outline" size={48} color="#9E9E9E" />
              <Text style={styles.emptyText}>No verified gyms found</Text>
              <Text style={styles.emptySubtext}>
                Please check your location or try again later
              </Text>
            </View>
          ) : (
            sortedGyms.map((gym) => {
              const distance = userLocation
                ? getDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    gym.location.coordinates[1],
                    gym.location.coordinates[0]
                  ).toFixed(1)
                : null;

              return (
                <TouchableOpacity
                  key={gym._id}
                  style={styles.gymCard}
                  onPress={() => handleGymSelection(gym)}
                  activeOpacity={0.8}
                >
                  <View style={styles.gymCardHeader}>
                    <View style={styles.gymInfo}>
                      {gym.media?.logoUrl || gym.media?.frontPhotoUrl ? (
                        <Image
                          source={{ uri: fixUrl(gym.media?.logoUrl || gym.media?.frontPhotoUrl) }}
                          style={styles.gymLogo}
                        />
                      ) : (
                        <View style={styles.gymLogoPlaceholder}>
                          <Ionicons name="fitness" size={20} color={COLORS.primary} />
                        </View>
                      )}
                      <View style={styles.gymDetails}>
                        <Text style={styles.gymName}>{gym.name}</Text>
                        <Text style={styles.gymAddress} numberOfLines={2}>
                          {gym.location.address}
                        </Text>
                        <View style={styles.gymMeta}>
                          <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={styles.ratingText}>
                              {gym.avgRating?.toFixed(1) || "0.0"}
                            </Text>
                          </View>
                          {distance && (
                            <View style={styles.distanceContainer}>
                              <Ionicons name="location" size={14} color={COLORS.primary} />
                              <Text style={styles.distanceText}>{distance} km</Text>
                            </View>
                          )}
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                            <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  </View>
                  
                  <View style={styles.gymCardFooter}>
                    <View style={styles.timingInfo}>
                      <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.timingText}>
                        {convertTo12Hour(gym.openTime)} - {convertTo12Hour(gym.closeTime)}
                      </Text>
                    </View>
                    <Text style={styles.selectText}>Tap to select</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerContent: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
  gymCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gymCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  gymInfo: {
    flexDirection: "row",
    flex: 1,
  },
  gymLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  gymLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  gymDetails: {
    flex: 1,
  },
  gymName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  gymAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  gymMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedText: {
    marginLeft: 4,
    fontSize: 13,
    color: COLORS.success,
    fontWeight: "500",
  },
  gymCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  timingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timingText: {
    marginLeft: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  selectText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
