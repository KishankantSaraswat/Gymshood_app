import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

interface GymCardProps {
  id: string;
  name: string;
  address: string;
  about: string;
  openTime: string;
  closeTime: string;
  distance: string;
  onPress?: () => void;
}

export default function GymCard({
  id,
  name,
  address,
  about,
  openTime,
  closeTime,
  distance,
  onPress,
}: GymCardProps) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={styles.card}>
        {/* Header with gradient background */}
        <LinearGradient
          colors={["#6C63FF", "#4A42E8"]}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.name}>{name}</Text>
          <View style={styles.distanceBadge}>
            <Ionicons name="location" size={14} color="#fff" />
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        </LinearGradient>

        {/* Card body */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={18}
              color="#6C63FF"
              style={styles.icon}
            />
            <Text style={styles.address} numberOfLines={2}>
              {address}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#6C63FF"
              style={styles.icon}
            />
            <Text style={styles.about} numberOfLines={2}>
              {about}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color="#6C63FF"
              style={styles.icon}
            />
            <Text style={styles.time}>
              {openTime} - {closeTime}
            </Text>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() =>{
              console.log("id",id)
              router.push({ pathname: "/gymProfile", params: {id} })
            }
            }
          >
            <Text style={styles.viewButtonText}>View</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    marginHorizontal:16,
  },
  cardHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 10,
  },
  distanceText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 4,
    fontWeight: "600",
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  address: {
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  about: {
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  time: {
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6C63FF",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  viewButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 8,
  },
});
