import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from "react-native-vision-camera";
import { fixUrl } from "../../utils/imageHelper";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

export function getGymStatus(shifts: any[], manualStatus: string) {
  if (manualStatus && manualStatus !== "open") return { isOpen: false, message: "Closed" };

  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  if (!shifts || shifts.length === 0) return { isOpen: false, message: "Closed" };

  const activeShift = shifts.find((shift: any) => {
    if (!shift.day || shift.day.toLowerCase() !== currentDay) return false;
    const [startH, startM] = shift.startTime.split(":").map(Number);
    const [endH, endM] = shift.endTime.split(":").map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (endTotal > startTotal) {
      return currentTime >= startTotal && currentTime < endTotal;
    } else {
      return currentTime >= startTotal || currentTime < endTotal;
    }
  });

  if (activeShift) {
    let genderLabel = activeShift.gender;
    if (genderLabel === "male") genderLabel = "Men";
    else if (genderLabel === "female") genderLabel = "Female";
    else genderLabel = "Unisex";
    return { isOpen: true, message: `Open for ${genderLabel}` };
  }

  return { isOpen: false, message: "Closed" };
}

export function isGymOpen(openTime: string, closeTime: string, status: string) {
  if (status && status !== "open") return false;
  if (!openTime || !closeTime) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [openHours, openMinutes] = openTime.split(":").map(Number);
  const [closeHours, closeMinutes] = closeTime.split(":").map(Number);

  const openTotalMinutes = openHours * 60 + openMinutes;
  const closeTotalMinutes = closeHours * 60 + closeMinutes;

  if (closeTotalMinutes > openTotalMinutes) {
    // Normal case (e.g., 08:00 - 22:00)
    return currentTime >= openTotalMinutes && currentTime < closeTotalMinutes;
  } else {
    // Overnight case (e.g., 22:00 - 06:00)
    return currentTime >= openTotalMinutes || currentTime < closeTotalMinutes;
  }
}

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

export default function PlansScreen() {
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("plans");
  const [enrichedPlans, setEnrichedPlans] = useState<any[]>([]);
  const [activeCheckInPlan, setActiveCheckInPlan] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const isFocused = useIsFocused();
  const [scanning, setScanning] = useState(true); // Add this to your component state

  const device = useCameraDevice("back");
  const codeScanner = useCodeScanner({
    codeTypes: ["qr"],
    onCodeScanned: (codes) => {
      const value = codes[0]?.value;
      console.log("Qr In", value);
      if (value && activeCheckInPlan) {
        handleBarCodeScanned({ data: value });
      }
    },
  });

  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "App needs access to your camera",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "granted");
      return status === "granted";
    }
  }, []);

  const enrichPlanData = async (plans: any[]) => {
    const enriched = await Promise.all(
      plans.map(async (plan) => {
        try {
          const [planRes, gymRes, capacityRes] = await Promise.all([
            fetch(`${API_BASE_URL}gymdb/plans/gym/${plan.gymId}`),
            fetch(`${API_BASE_URL}gymdb/gyms?id=${plan.gymId}`),
            fetch(`${API_BASE_URL}gymdb/gym/${plan.gymId}/active-capacity`),
          ]);

          const planData = await planRes.json();
          const gymData = await gymRes.json();
          const capacityData = await capacityRes.json();

          const matchedPlan = planData?.plans?.find(
            (p: any) => p._id === plan.planId
          );
          const matchedGym = gymData?.gyms?.find(
            (g: any) => g._id === plan.gymId
          );

          return {
            ...plan,
            planName: matchedPlan?.name || "Unnamed Plan",
            gymDetails: {
              name: matchedGym?.name || "Unnamed Gym",
              media: matchedGym?.media || null,
              shifts: matchedGym?.shifts || [],
              status: matchedGym?.status || "open",
            },
            capacityInfo: capacityData?.success ? {
              isOpen: capacityData.isOpen,
              activeCount: capacityData.activeCount,
              capacity: capacityData.capacity,
              shiftInfo: capacityData.shiftInfo,
            } : null,
          };
        } catch (error) {
          console.error("Failed to fetch plan/gym info:", error);
          return plan;
        }
      })
    );
    setEnrichedPlans(enriched);
  };

  const fetchData = async () => {
    try {
      await Promise.all([fetchPlans(), fetchTransactions()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}gymdb/plans/user`, {
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans);
        enrichPlanData(data.plans);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}gymdb/api/transactions`, {
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      console.log("Trans", data);
      if (data.success) setTransactions(data.data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;

    setScanning(false); // Pause scanning immediately

    try {
      const qrData = data;
      console.log("Qr", qrData);

      if (!qrData) {
        console.log("QR Empty");
        setScanning(true); // Resume scanning
        return;
      }

      if (qrData.length !== String("6854dc7f7546c1ca221cb9f0").length) {
        console.log("QR Length Mismatch");
        setScanning(true); // Resume scanning
        return;
      }

      if (activeCheckInPlan) {
        if (activeCheckInPlan.gymId !== qrData) {
          Alert.alert(
            "Wrong Gym",
            `This QR is for a different gym. Your plan is for ${activeCheckInPlan.gymDetails.name}`,
            [
              {
                text: "OK",
                onPress: () => setScanning(true), // Resume scanning after alert dismissed
              },
            ]
          );
          return;
        }

        const response = await fetch(`${API_BASE_URL}gymdb/gym/check-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userPlanId: activeCheckInPlan._id }),
        });

        const result = await response.json();
        console.log("Scan Result", result);

        if (response.ok) {
          Alert.alert(
            "Check-In Successful",
            `You're checked in until ${new Date(
              result.checkOutTime
            ).toLocaleTimeString()}`,
            [
              {
                text: "OK",
                onPress: () => {
                  setActiveCheckInPlan(null);
                  refreshData();
                  setScanning(true); // Resume scanning
                },
              },
            ]
          );
        } else {
          if (result.message.includes("already checked in")) {
            // Show custom alert with checkout option
            Alert.alert("Already Checked In", result.message, [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => setScanning(true), // Resume scanning
              },
              {
                text: "Check Out",
                onPress: () => handleCheckOut(activeCheckInPlan.gymId),
              },
            ]);
          } else {
            Alert.alert("Error", result.message || "Check-in failed", [
              {
                text: "OK",
                onPress: () => setScanning(true), // Resume scanning
              },
            ]);
          }
        }
      }
    } catch (e) {
      Alert.alert("Error", "Invalid QR code format", [
        {
          text: "OK",
          onPress: () => setScanning(true), // Resume scanning
        },
      ]);
    }
  };

  const handleCheckOut = async (gymId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}gymdb/gym/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gymId }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          "Check-Out Successful",
          "You have been successfully checked out",
          [
            {
              text: "OK",
              onPress: () => {
                setActiveCheckInPlan(null);
                refreshData();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", result.message || "Check-out failed");
      }
    } catch (error) {
      console.error("Check-out error:", error);
      Alert.alert("Error", "Failed to check out");
    } finally {
      setScanning(true); // Resume scanning
    }
  };

  const refreshData = () => {
    setRefreshing(true);
    fetchData();
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


  function convertTo12Hour(time24: String) {
    const [hourStr, minuteStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr.padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // converts 0 → 12, 13 → 1, etc.
    return `${hour}:${minute} ${ampm}`;
  }

  const renderPlan = ({ item }: any) => {
    console.log("Plan", item);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          if (item.gymId) {
            router.push({
              pathname: "/gymProfile",
              params: { id: item.gymId },
            });
          }
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Plan: {item.planName}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.isExpired ? "#FFEBEE" : "#E8F5E9" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.isExpired ? COLORS.error : COLORS.success },
              ]}
            >
              {item.isExpired ? "Expired" : "Active"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={COLORS.primary} />
          <Text style={styles.detailText}>{item.usedDays}/{item.totalDays} days used</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={COLORS.primary} />
          <Text style={styles.detailText}>Valid till {item.maxExpiryDate?.slice(0, 10) + ", " + convertTo12Hour(item.maxExpiryDate?.slice(12, -8))}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color={COLORS.primary} />
          <Text style={styles.detailText}>₹{item.amountDeducted}</Text>
        </View>

        {item.gymDetails && (
          <View style={styles.gymInfo}>
            <Image
              source={{
                uri:
                  fixUrl(item.gymDetails.media?.logoUrl) ||
                  "https://via.placeholder.com/50",
              }}
              style={styles.gymImage}
            />
            <View style={styles.gymNameContainer}>
              <View>
                <Text style={styles.gymName}>{item.gymDetails.name}</Text>
                {item.gymDetails.shifts && (
                  <View
                    style={[
                      styles.gymStatusBadge,
                      {
                        backgroundColor: getGymStatus(
                          item.gymDetails.shifts,
                          item.gymDetails.status
                        ).isOpen
                          ? "#E8F5E9"
                          : "#FFEBEE",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.gymStatusText,
                        {
                          color: getGymStatus(
                            item.gymDetails.shifts,
                            item.gymDetails.status
                          ).isOpen
                            ? "#2E7D32"
                            : "#C62828",
                        },
                      ]}
                    >
                      {
                        getGymStatus(
                          item.gymDetails.shifts,
                          item.gymDetails.status
                        ).message
                      }
                    </Text>
                  </View>
                )}

                {/* Capacity Information */}
                {item.capacityInfo && item.capacityInfo.isOpen && (
                  <View style={styles.capacityContainer}>
                    <View style={styles.capacityHeader}>
                      <Ionicons name="people" size={14} color={COLORS.primary} />
                      <Text style={styles.capacityText}>
                        {item.capacityInfo.activeCount}/{item.capacityInfo.capacity} checked in
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min((item.capacityInfo.activeCount / item.capacityInfo.capacity) * 100, 100)}%`,
                            backgroundColor:
                              (item.capacityInfo.activeCount / item.capacityInfo.capacity) >= 0.9
                                ? "#F44336"
                                : (item.capacityInfo.activeCount / item.capacityInfo.capacity) >= 0.7
                                  ? "#FFA000"
                                  : "#4CAF50"
                          }
                        ]}
                      />
                    </View>

                    {/* Shift Time */}
                    {item.capacityInfo.shiftInfo && (
                      <Text style={styles.shiftTimeText}>
                        {convertTo12Hour(item.capacityInfo.shiftInfo.startTime)} - {convertTo12Hour(item.capacityInfo.shiftInfo.endTime)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {!item.isExpired && (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={async () => {
              try {
                // Directly request permission without showing custom dialog first
                const hasPerm = await requestCameraPermission();

                if (hasPerm) {
                  setActiveCheckInPlan(item);
                } else {
                  // Only show explanation if permission was denied
                  Alert.alert(
                    "Permission Required",
                    "Camera permission is needed to scan QR codes. Please enable it in Settings.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Open Settings",
                        onPress: () => Linking.openSettings(),
                      },
                    ]
                  );
                }
              } catch (err) {
                console.error("Permission error:", err);
              }
            }}
          >
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderTransaction = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>TXN: {item._id.slice(-6)}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "Completed" ? "#E8F5E9" : "#FFF8E1",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: item.status === "Completed" ? COLORS.success : "#FFA000",
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Ionicons
          name={item.type === "Debit" ? "arrow-down-circle" : "arrow-up-circle"}
          size={16}
          color={item.type === "Debit" ? COLORS.error : COLORS.success}
        />
        <Text
          style={[
            styles.detailText,
            { color: item.type === "Debit" ? COLORS.error : COLORS.success },
          ]}
        >
          {item.type === "Debit" ? "-" : "+"}₹{item.amount}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="document-text" size={16} color={COLORS.primary} />
        <Text style={styles.detailText}>{item.reason}</Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="time" size={16} color={COLORS.primary} />
        <Text style={styles.detailText}>
          {new Date(item.transactionDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {item.metadata?.gymId && (
        <View style={styles.gymInfo}>
          <Image
            source={{ uri: "https://via.placeholder.com/50" }}
            style={styles.gymImage}
          />
          <Text style={styles.gymName}>
            Gym ID: {item.metadata.gymId.slice(-6)}
          </Text>
        </View>
      )}
    </View>
  );
  const QRView = () => {
    if (!device) {
      return (
        <View style={[styles.cameraContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white' }}>No camera device found</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setActiveCheckInPlan(null)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused && !!activeCheckInPlan}
          codeScanner={codeScanner}
          audio={false}
        />

        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <Text style={styles.scannerText}>Align QR code within frame</Text>
          <Text style={styles.scannerSubtext}>
            Scanning for {activeCheckInPlan?.gymDetails?.name}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setActiveCheckInPlan(null)}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

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
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.avatar}>
            <Ionicons name="wallet" size={40} color="#fff" />
          </View>
          <Text style={styles.headerName}>My Plans & Transactions</Text>
          <Text style={styles.headerEmail}>Manage your memberships</Text>
        </LinearGradient>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "plans" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("plans")}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={activeTab === "plans" ? "#fff" : COLORS.primary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "plans" && styles.activeTabText,
              ]}
            >
              My Plans
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "transactions" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("transactions")}
          >
            <Ionicons
              name="receipt"
              size={20}
              color={activeTab === "transactions" ? "#fff" : COLORS.primary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "transactions" && styles.activeTabText,
              ]}
            >
              Transactions
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : (
          <View style={styles.contentContainer}>
            {activeTab === "plans" ? (
              <>
                <Text style={styles.sectionTitle}>Your Membership Plans</Text>
                {enrichedPlans.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="sad-outline" size={48} color="#9E9E9E" />
                    <Text style={styles.emptyText}>
                      No active or previous plans
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Purchase a plan to get started
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={enrichedPlans}
                    keyExtractor={(item) => item._id}
                    renderItem={renderPlan}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => (
                      <View style={styles.separator} />
                    )}
                  />
                )}
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                {transactions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="receipt-outline"
                      size={48}
                      color="#9E9E9E"
                    />
                    <Text style={styles.emptyText}>No transactions found</Text>
                    <Text style={styles.emptySubtext}>
                      Your transactions will appear here
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={transactions}
                    keyExtractor={(item) => item._id}
                    renderItem={renderTransaction}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => (
                      <View style={styles.separator} />
                    )}
                  />
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {activeCheckInPlan && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={!!activeCheckInPlan}
        >
          <QRView />
        </Modal>
      )}
    </SafeAreaView>
  );
}

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
  scrollContainer: {
    flexGrow: 1,
  },
  loader: {
    marginTop: 40,
    marginBottom: 40,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  activeTabText: {
    color: "#fff",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 15,
    marginLeft: 5,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  gymInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  gymImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  gymNameContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gymName: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  gymStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  gymStatusText: {
    fontSize: 10,
    fontWeight: "bold",
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
  separator: {
    height: 10,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
    position: "relative",
  },
  scannerOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 0,
    position: "relative",
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: "#6C63FF",
    width: 50,
    height: 50,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: "#6C63FF",
    width: 50,
    height: 50,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: "#6C63FF",
    width: 50,
    height: 50,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: "#6C63FF",
    width: 50,
    height: 50,
  },
  scannerText: {
    color: "white",
    marginTop: 30,
    fontSize: 18,
    fontWeight: "500",
  },
  scannerSubtext: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 10,
    fontSize: 14,
  },
  cancelButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 10,
  },
  checkInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    alignItems: "center",
  },
  checkInButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  capacityContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  capacityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  capacityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  shiftTimeText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
});
