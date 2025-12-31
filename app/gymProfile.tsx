import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import Constants from "expo-constants";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
// Removed TabView import as we're implementing custom tabs

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";
const { width } = Dimensions.get("window");
import { fixUrl } from "../utils/imageHelper";

export function getValidity(planDuration: string) {
  if (planDuration.trim() === "1 day") {
    return 7;
  } else if (planDuration.trim() === "7 days") {
    return 30;
  } else if (planDuration.trim() === "15 days") {
    return 45;
  } else if (planDuration.trim() === "1 month") {
    return 90;
  }
}



const PhotosTab = ({ gym }: { gym: any }) => {

  const rawImages = [
    gym.media?.frontPhotoUrl,
    gym.media?.receptionPhotoUrl,
    gym.media?.workoutFloorPhotoUrl,
    gym.media?.lockerRoomPhotoUrl,
    gym.media?.trainerTeamPhotoUrl,
    ...(gym.media?.mediaUrls || [])
  ];

  const imageUrls = rawImages
    .filter(url => url && typeof url === 'string' && /\.(jpg|jpeg|png|gif|webp|jp._)$/i.test(url))
    .map((url: string) => fixUrl(url));

  return (
    <View style={styles.tabContent}>
      {imageUrls.length > 0 ? (
        <View>
          {imageUrls.map((url: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.photoItem}
              onPress={() =>
                router.push({
                  pathname: "/fullScreenImage",
                  params: { imageUrl: url },
                })
              }
            >
              <Image
                source={{ uri: fixUrl(url) }}
                style={styles.photoImage}
                onError={(e) => console.log(`Failed to load photo: ${url}`, e.nativeEvent.error)}
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.noContentText}>No photos available</Text>
      )}
    </View>
  );
};

const SlotsTab = ({ gym }: { gym: any }) => {
  const shiftsByDay = gym.shifts.reduce((acc: any, shift: any) => {
    if (!shift.day) {
      return acc;
    }
    const day = shift.day.toLowerCase();

    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(shift);
    return acc;
  }, {});

  const daysOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <View style={styles.tabContent}>
      {gym.shifts?.length > 0 ? (
        <View>
          {daysOrder.map((day) => {
            if (!shiftsByDay[day]?.length) return null;

            return (
              <View key={day} style={styles.dayContainer}>
                <Text style={styles.dayHeader}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>

                {shiftsByDay[day].map((shift: any, index: number) => (
                  <View key={index} style={styles.slotItem}>
                    <View style={styles.slotInfo}>
                      <Text style={styles.slotName}>{shift.name}</Text>
                      <Text style={styles.slotTime}>
                        {new Date(
                          `2000-01-01T${shift.startTime}`
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(
                          `2000-01-01T${shift.endTime}`
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>

                    <View style={styles.slotDetails}>
                      <View style={styles.detailBadge}>
                        <Ionicons name="people" size={14} color="#6C63FF" />
                        <Text style={styles.detailText}>
                          Capacity: {shift.capacity}
                        </Text>
                      </View>

                      <View style={styles.detailBadge}>
                        <Ionicons
                          name={
                            shift.gender === "unisex"
                              ? "male-female"
                              : shift.gender === "male"
                                ? "male"
                                : "female"
                          }
                          size={14}
                          color="#6C63FF"
                        />
                        <Text style={styles.detailText}>
                          {shift.gender === "unisex"
                            ? "Unisex"
                            : shift.gender === "male"
                              ? "Men Only"
                              : "Women Only"}
                        </Text>
                      </View>
                    </View>

                    {shift.notes && (
                      <Text style={styles.slotNotes}>
                        <Ionicons
                          name="information-circle"
                          size={14}
                          color="#666"
                        />{" "}
                        {shift.notes}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.noContentText}>No slots available</Text>
      )}
    </View>
  );
};

const EquipmentTab = ({ gym }: { gym: any }) => (
  <View style={styles.tabContent}>
    {gym.equipmentList?.length > 0 ? (
      <View style={styles.equipmentGrid}>
        {gym.equipmentList.map((item: string, index: number) => (
          <View key={index} style={styles.equipmentItem}>
            <Ionicons name="checkmark-circle" size={20} color="#6C63FF" />
            <Text style={styles.equipmentText}>{item}</Text>
          </View>
        ))}
      </View>
    ) : (
      <Text style={styles.noContentText}>No equipment listed</Text>
    )}
  </View>
);

const PlanTab = ({ plans, gym }: { plans: any; gym: any }) => {
  const handleBuyPlan = (planId: string) => {
    const matchedPlan = plans.find((plan: any) => plan._id === planId);
    router.push({
      pathname: "/buyPlan",
      params: {
        plan: JSON.stringify(matchedPlan),
        gym: JSON.stringify(gym),
      },
    });
  };

  return (
    <View style={styles.plansContainer}>
      {plans.map((plan: any, index: number) => (
        <View key={index} style={styles.planItem}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>₹{plan.price}</Text>
          </View>
          <Text style={styles.planDuration}>
            {plan.planType} valid for {getValidity(plan.planType)} days
          </Text>
          {plan.features && (
            <View style={styles.featuresContainer}>
              {plan.features.split(",").map((feature: string, i: number) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#6C63FF" />
                  <Text style={styles.featureText}>{feature.trim()}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.planFooter}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {plan.discountPercent}% OFF
              </Text>
            </View>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => handleBuyPlan(plan._id)}
            >
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const ReviewsTab = ({ gymId }: { gymId: string }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserName, setcurrentUserName] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserName) {
      fetchReviews();
    }
  }, [currentUserName, gymId]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}auth/profile`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data && data.user) {
        setcurrentUserName(data.user.name);
      }
    } catch (e) {
      console.error("Error fetching current user", e);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}gymdb/ratings/gym/${gymId}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("Server error detail:", data);
        Alert.alert("Error", data.message || "Failed to fetch reviews");
        return;
      }

      const ratings = data.ratings || [];
      setReviews(ratings);

      const existing = ratings.find(
        (r: any) => r.user?.name === currentUserName
      );

      if (existing) {
        setRating(existing.rating);
        setFeedback(existing.feedback);
        setExistingReviewId(existing.id);
      } else {
        setRating(0);
        setFeedback("");
        setExistingReviewId(null);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!rating) {
      Alert.alert("Error", "Please select a rating before submitting.");
      return;
    }

    if (!feedback.trim()) {
      Alert.alert("Error", "Please write your feedback before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      const url = existingReviewId
        ? `${API_BASE_URL}gymdb/ratings/${existingReviewId}`
        : `${API_BASE_URL}gymdb/ratings`;

      const method = existingReviewId ? "PUT" : "POST";

      const payload = existingReviewId
        ? {
          stars: rating,
          comment: feedback,
        }
        : {
          gymId,
          rating: rating,
          feedback,
        };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        Alert.alert("Error", result.message || "Submission failed");
      } else {
        Alert.alert(
          "Success",
          existingReviewId
            ? "Review updated successfully!"
            : "Thank you for your review!"
        );
        fetchReviews();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={reviewStyles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={20}
            color={star <= rating ? "#FFD700" : "#CCCCCC"}
            style={reviewStyles.starIcon}
          />
        ))}
      </View>
    );
  };

  const StarRatingInput = () => {
    return (
      <View style={styles.ratingInputContainer}>
        <Text style={styles.inputLabel}>Your Rating*</Text>
        <View style={reviewStyles.starsInputContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={32}
                color={star <= rating ? "#FFD700" : "#DDDDDD"}
                style={reviewStyles.starInputIcon}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating > 0
            ? `${rating} star${rating > 1 ? "s" : ""}`
            : "Not rated yet"}
        </Text>
      </View>
    );
  };

  return (
    <View style={reviewStyles.reviewsContainer}>
      {/* Review Form */}
      <View style={reviewStyles.reviewFormContainer}>
        <Text style={reviewStyles.sectionTitle}>
          {existingReviewId ? "Edit Your Review" : "Write a Review"}
        </Text>

        <StarRatingInput />

        <View style={reviewStyles.feedbackContainer}>
          <Text style={styles.inputLabel}>Your Feedback*</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Share your experience with this gym..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
            (!rating || !feedback.trim()) &&
            reviewStyles.submitButtonInactive,
          ]}
          onPress={submitReview}
          disabled={submitting || !rating || !feedback.trim()}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingReviewId ? "Update Review" : "Submit Review"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      <View style={reviewStyles.reviewsListContainer}>
        <Text style={reviewStyles.sectionTitle}>
          {reviews.length > 0
            ? `Member Reviews (${reviews.length})`
            : "No Reviews Yet"}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#6C63FF" />
        ) : reviews.length > 0 ? (
          reviews.map((review, index) => (
            <View key={index} style={reviewStyles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={reviewStyles.userInfo}>
                  <Ionicons
                    name="person-circle"
                    size={32}
                    color="#6C63FF"
                    style={reviewStyles.userIcon}
                  />
                  <Text style={reviewStyles.userName}>
                    {review.user?.name || "Anonymous"}
                  </Text>
                </View>
                <View style={reviewStyles.reviewMeta}>
                  {renderStars(review.rating)}
                  <Text style={reviewStyles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <Text style={reviewStyles.reviewContent}>
                {review.feedback}
              </Text>

              {index < reviews.length - 1 && (
                <View style={styles.reviewDivider} />
              )}
            </View>
          ))
        ) : (
          <View style={styles.noReviewsContainer}>
            <Ionicons name="chatbox-outline" size={48} color="#CCCCCC" />
            <Text style={reviewStyles.noReviewsText}>
              Be the first to review this gym!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Add these to your StyleSheet
const reviewStyles = StyleSheet.create({
  reviewsContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  reviewsScrollContainer: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  reviewFormContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  ratingInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
  },
  starsInputContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  starInputIcon: {
    marginHorizontal: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  feedbackContainer: {
    marginBottom: 20,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    minHeight: 120,
    textAlignVertical: "top",
    backgroundColor: "#FFF",
  },
  submitButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonInactive: {
    backgroundColor: "#CCCCCC",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  reviewsListContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  reviewCard: {
    paddingVertical: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userIcon: {
    marginRight: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  reviewMeta: {
    alignItems: "flex-end",
  },
  starsContainer: {
    flexDirection: "row",
  },
  starIcon: {
    marginRight: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  reviewContent: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 16,
  },
  noReviewsContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noReviewsText: {
    fontSize: 15,
    color: "#999",
    marginTop: 12,
  },
});

const AboutTab = ({ gym }: { gym: any }) => {
  function convertTo12Hour(time24: String) {
    const [hourStr, minuteStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr.padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.aboutText}>{gym.about}</Text>
      <View style={styles.infoItem}>
        <Ionicons name="time-outline" size={20} color="#6C63FF" />
        <Text style={styles.infoText}>
          Open Hours: {convertTo12Hour(gym.openTime)} -{" "}
          {convertTo12Hour(gym.closeTime)}
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Ionicons name="people-outline" size={20} color="#6C63FF" />
        <Text style={styles.infoText}>Capacity: {gym.capacity}</Text>
      </View>
      <View style={styles.infoItem}>
        <Ionicons name="call-outline" size={20} color="#6C63FF" />
        <Text style={styles.infoText}>Phone: {gym.phone}</Text>
      </View>
      <View style={styles.infoItem}>
        <Ionicons name="mail-outline" size={20} color="#6C63FF" />
        <Text style={styles.infoText}>Email: {gym.contactEmail}</Text>
      </View>
    </View>
  );
};

export default function GymProfileScreen() {
  const route = useRoute();
  const { id } = route.params as { id: string };
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [plans, setPlans] = useState<any[]>([]);

  const [routes] = React.useState([
    { key: "plans", title: "PLANS" },
    { key: "photos", title: "PHOTOS" },
    { key: "slots", title: "SLOTS" },
    { key: "equipment", title: "EQUIPMENT" },
    { key: "reviews", title: "REVIEWS" },
    { key: "about", title: "ABOUT" },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gymRes, plansRes] = await Promise.all([
          fetch(`${API_BASE_URL}gymdb/gyms?id=${id}`),
          fetch(`${API_BASE_URL}gymdb/plans/gym/${id}`),
        ]);

        const gymData = await gymRes.json();
        const plansData = await plansRes.json();

        if (gymData.success && Array.isArray(gymData.gyms)) {
          const matchedGym = gymData.gyms.find((g: any) => g._id === id);
          if (matchedGym) {
            setGym(matchedGym);
          } else {
            Alert.alert("Error", "Gym not found");
          }
        }

        if (plansData.success && Array.isArray(plansData.plans)) {
          setPlans(plansData.plans);
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const renderScene = ({ route }: { route: any }) => {
    switch (route.key) {
      case "plans":
        return <PlanTab plans={plans} gym={gym} />;
      case "photos":
        return <PhotosTab gym={gym} />;
      case "slots":
        return <SlotsTab gym={gym} />;
      case "equipment":
        return <EquipmentTab gym={gym} />;
      case "reviews":
        return <ReviewsTab gymId={id} />;
      case "about":
        return <AboutTab gym={gym} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!gym) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>No gym data found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={() => {
              if (gym.media?.logoUrl) {
                router.push({
                  pathname: "/fullScreenImage",
                  params: { imageUrl: gym.media.logoUrl },
                });
              }
            }}
          >
            <Image
              source={
                gym.media?.logoUrl
                  ? {
                    uri: fixUrl(gym.media.logoUrl)
                  }
                  : require("../assets/images/favicon.png")
              }
              style={styles.profileImage}
              onError={(e) => console.log(`Failed to load logo: ${gym.media?.logoUrl}`, e.nativeEvent.error)}
            />
          </TouchableOpacity>

          <Text style={styles.gymName}>{gym.name}</Text>
          <Text style={styles.gymSlogan}>{gym.gymslogan}</Text>

          <View style={styles.headerBottomRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {gym.avgRating.toFixed(1) || "0"}
              </Text>
            </View>

            {gym.location?.coordinates && (
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={() => {
                  const [longitude, latitude] = gym.location.coordinates;
                  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                  Linking.openURL(url).catch((err) => {
                    Alert.alert("Error", "Could not open Google Maps");
                    console.error("Failed to open maps:", err);
                  });
                }}
              >
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.navigationButtonText}>Navigate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Custom Tab Bar */}
        <View style={styles.customTabBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}
          >
            {routes.map((route, tabIndex) => (
              <TouchableOpacity
                key={route.key}
                style={[
                  styles.customTab,
                  index === tabIndex && styles.activeTab,
                ]}
                onPress={() => setIndex(tabIndex)}
              >
                <Text
                  style={[
                    styles.customTabLabel,
                    index === tabIndex && styles.activeTabLabel,
                  ]}
                >
                  {route.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* <View style={[styles.tabIndicator, { left: (width / routes.length) * index }]} /> */}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentContainer}>
          {renderScene({ route: routes[index] })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#333",
    fontSize: 16,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 36,
    backgroundColor: "#6C63FF",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
  },
  gymName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
    marginBottom: 5,
  },
  gymSlogan: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  headerBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  navigationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6C63FF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  navigationButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  tabContentContainer: {
    backgroundColor: "#fff",
  },
  // Custom Tab Bar Styles
  customTabBar: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    position: "relative",
  },
  tabBarContent: {
    paddingHorizontal: 16,
  },
  customTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  activeTab: {
    // Active tab styling handled by label color
  },
  customTabLabel: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#888",
  },
  activeTabLabel: {
    color: "#6C63FF",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    backgroundColor: "#6C63FF",
    width: width / 6,
    transition: "left 0.3s ease",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  tabContent: {
    padding: 16,
    backgroundColor: "#fff",
  },
  // Reviews specific styles
  reviewsTabContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  reviewsScrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  reviewsContainer: {
    marginBottom: 24,
  },
  reviewItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  reviewRatingText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  reviewComment: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginTop: 12,
  },
  noReviewsContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  noContentText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  noContentSubText: {
    fontSize: 14,
    color: "#999",
  },
  reviewForm: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewFormTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  ratingInputContainer: {
    marginBottom: 16,
  },
  feedbackInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#555",
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  feedbackInput: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 6,
    padding: 14,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#a0c4f8",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Other tab styles
  plansContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 20,
  },
  planItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
    width: "100%",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  planName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6C63FF",
  },
  planDuration: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  featuresContainer: {
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  featureText: {
    fontSize: 13,
    color: "#444",
    marginLeft: 5,
  },
  planFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  discountBadge: {
    backgroundColor: "#FFE8E8",
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  discountText: {
    fontSize: 12,
    color: "#FF5252",
    fontWeight: "500",
  },
  buyButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  buyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  photoItem: {
    width: width - 32,
    height: 200,
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  dayContainer: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6C63FF",
    marginBottom: 12,
  },
  slotItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  slotInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  slotName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 10

  },
  slotTime: {
    fontSize: 14,
    color: "#666",
  },
  slotDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  detailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0ff",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 4,
  },
  slotNotes: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  equipmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  equipmentItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 12,
  },
  equipmentText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  aboutText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },
});
