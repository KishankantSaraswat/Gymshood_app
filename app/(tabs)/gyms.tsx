import React, { useEffect, useCallback, useState, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import GymCard from "../../components/GymCard";
import Constants from "expo-constants";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

// Consistent color scheme with other screens
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

export default function GymsScreen() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);
  const [range, setRange] = useState("10");
  const [searchFocused, setSearchFocused] = useState(false);
  const mapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      await Promise.all([fetchGyms(), getUserLocation()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchGyms = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}gymdb/gyms`);
      const data = await res.json();
      if (data.success) setGyms(data.gyms);
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

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const numericRange = parseFloat(range) || 0;

  const filteredGyms = gyms
    .filter((gym) => {
      if (!userLocation) return true;

      // Check distance
      const [lon, lat] = gym.location.coordinates;
      const distance = getDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lon
      );
      if (distance > numericRange) return false;

      // Check search text
      if (searchQuery.trim() === "") return true;
      return gym.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (!userLocation) return 0; // No sorting if no location

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

  console.log("Filtred Gyms", filteredGyms);

  const focusOnUserLocation = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };
  function convertTo12Hour(time24: String) {
    const [hourStr, minuteStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr.padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // converts 0 → 12, 13 → 1, etc.
    return `${hour}:${minute} ${ampm}`;
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.avatar}>
            <Ionicons name="fitness" size={40} color="#fff" />
          </View>
          <Text style={styles.headerName}>Find Nearby Gyms</Text>
          <Text style={styles.headerEmail}>
            Discover fitness centers near you
          </Text>
        </LinearGradient>

        {/* Search and Filter Section */}
        <View style={styles.filterContainer}>
          <View
            style={[
              styles.searchInput,
              searchFocused && styles.searchInputFocused,
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={COLORS.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search gyms..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </View>

          <View style={styles.rangeSelector}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.rangeText}>Within</Text>
            <TextInput
              style={styles.rangeInput}
              keyboardType="numeric"
              value={range}
              onChangeText={setRange}
              placeholder="10"
            />
            <Text style={styles.rangeText}>km</Text>
          </View>
        </View>

        {/* Map Section */}
        {userLocation && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              customMapStyle={mapStyle}
            >
              <Marker
                coordinate={userLocation}
                title="You are here"
                pinColor={COLORS.primary}
              />

              {filteredGyms.map((gym) => {
                const [lon, lat] = gym.location.coordinates;
                return (
                  <Marker
                    key={gym._id}
                    coordinate={{ latitude: lat, longitude: lon }}
                    title={gym.name}
                    description={gym.location.address}
                  />
                );
              })}
            </MapView>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={focusOnUserLocation}
            >
              <Ionicons name="locate" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Results Section */}
        <View style={styles.resultsHeader}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Available Gyms</Text>
          </View>
          <Text style={styles.resultsCount}>{filteredGyms.length} found</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : filteredGyms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={48} color="#9E9E9E" />
            <Text style={styles.emptyText}>No gyms found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try a different search"
                : "Adjust your range or location"}
            </Text>
          </View>
        ) : (
          filteredGyms.map((gym) => (
            <GymCard
              key={gym._id}
              id={gym._id}
              name={gym.name}
              address={gym.location.address}
              about={gym.about}
              openTime={convertTo12Hour(gym.openTime)}
              closeTime={convertTo12Hour(gym.closeTime)}
              distance={
                userLocation
                  ? getDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      gym.location.coordinates[1],
                      gym.location.coordinates[0]
                    ).toFixed(1) + " km"
                  : "N/A"
              }
              onPress={() => {
                const [lon, lat] = gym.location.coordinates;
                mapRef.current?.animateToRegion(
                  {
                    latitude: lat,
                    longitude: lon,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  },
                  1000
                );
              }}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const mapStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#f5f5f5",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#f5f5f5",
      },
    ],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#bdbdbd",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [
      {
        color: "#eeeeee",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#e5e5e5",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        color: "#ffffff",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#dadada",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [
      {
        color: "#e5e5e5",
      },
    ],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [
      {
        color: "#eeeeee",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#c9c9c9",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    flex: 1,
  },
  filterContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  rangeSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rangeText: {
    marginHorizontal: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  rangeInput: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 4,
    width: 50,
    textAlign: "center",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
    paddingHorizontal: 16,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  locationButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: COLORS.cardBackground,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: COLORS.textPrimary,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loader: {
    marginVertical: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
});
