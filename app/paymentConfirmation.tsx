import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { getValidity } from "./gymProfile";

const PaymentConfirmationScreen = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const plan = JSON.parse(params.plan as string);
  const gym = JSON.parse(params.gym as string);
  const paymentMethod = params.paymentMethod as string;
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Payment Successful!</Text>
          <Text style={styles.subtitle}>
            Your membership has been activated
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>₹{plan.price}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gym</Text>
            <Text style={styles.detailValue}>{gym.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{plan.planType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Validity</Text>
            <Text style={styles.detailValue}>{getValidity(plan.planType)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>
              {paymentMethod === "card"
                ? "Credit/Debit Card"
                : paymentMethod === "upi"
                ? "UPI Payment"
                : "Net Banking"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>
              TXN{Math.random().toString(36).substring(2, 10).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.gymCard}>
          <Image
            source={
              gym.media?.mediaUrl
                ? { uri: gym.media.logoUrl }
                : require("../assets/images/icon.png")
            }
            style={styles.gymImage}
          />
          <View style={styles.gymInfo}>
            <Text style={styles.gymName}>{gym.name}</Text>
            <Text style={styles.gymAddress}>{gym.location.address}</Text>
            <View style={styles.gymHours}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.gymHoursText}>
                Opens until {gym.closeTime}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>What's Next?</Text>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="qr-code-outline" size={20} color="#6C63FF" />
            </View>
            <Text style={styles.instructionText}>
              Scan the QR code at gym to checkin and begin your workout.
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="calendar-outline" size={20} color="#6C63FF" />
            </View>
            <Text style={styles.instructionText}>
              Your membership is valid from today until{" "}
              {getValidity(plan.planType)} days
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            router.push({ pathname: "gymProfile", params: { id: gym._id } })
          }
        >
          <Text style={styles.primaryButtonText}>View Gym Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginBottom: 16,
    marginTop: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6C63FF",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  gymCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gymImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  gymAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  gymHours: {
    flexDirection: "row",
    alignItems: "center",
  },
  gymHoursText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 5,
  },
  instructions: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 15,
  },
  instructionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 15,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6C63FF",
  },
  secondaryButtonText: {
    color: "#6C63FF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PaymentConfirmationScreen;
