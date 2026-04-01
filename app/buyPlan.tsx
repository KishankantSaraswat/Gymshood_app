import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import { WebView } from "react-native-webview";
import { getValidity } from "./gymProfile";
import { fixUrl } from "../utils/imageHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../components/CustomAlert";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

const PurchasePlanScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const webViewRef = useRef(null);

  const params = useLocalSearchParams();
  const plan = JSON.parse(params.plan as string);
  const gym = JSON.parse(params.gym as string);
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [walletTransactionId, setWalletTransactionId] = useState<string>("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cashRequestData, setCashRequestData] = useState<any>(null);

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

  useEffect(() => {
    const getUserDetails = async () => {
      const localData = await AsyncStorage.getItem("userInfo");
      if (localData) {
        const data = JSON.parse(localData);
        if (data) {
          setName(data.name);
          setEmail(data.email);
        }
      }
    };
    getUserDetails();
  }, []);
  const openPrivacyPolicy = () => {
    Linking.openURL("https://gymshood.blogspot.com/p/privacy-policy.html");
  };

  const openTermsConditions = () => {
    Linking.openURL("https://gymshood.blogspot.com/p/terms-conditions.html");
  };

  const discountedPrice = plan.discountPercent > 0
    ? Math.round(plan.price * (1 - plan.discountPercent / 100))
    : plan.price;

  const handlePurchase = async (mode: 'online' | 'cash' = 'online') => {
    console.log('\n========== BUY PLAN - HANDLE PURCHASE ==========');
    console.log('[BuyPlan] Payment Mode:', mode);
    console.log('[BuyPlan] Plan Details:', {
      planId: plan._id,
      planName: plan.name,
      planPrice: plan.price,
      discountedPrice,
      gymId: gym._id,
      gymName: gym.name
    });

    if (!agreeTerms) {
      showAlert(
        "Terms Required",
        "You must agree to the terms and conditions",
        "warning"
      );
      return;
    }
    if (!name || !email || !phone) {
      showAlert("Missing Info", "Please fill all the required details", "warning");
      return;
    }
    if (!(phone.length >= 10 && phone.length <= 13)) {
      showAlert("Invalid Contact", "Please fill a valid contact.", "warning");
      return;
    }
    setLoading(true);

    try {
      const requestPayload = {
        amount: discountedPrice * 100,
        currency: "INR",
        receipt: `plan_${plan._id}_${Date.now()}`,
        planId: plan._id,
        paymentMode: mode
      };

      console.log('[BuyPlan] API Request Payload:', requestPayload);
      console.log('[BuyPlan] API Endpoint:', `${API_BASE_URL}gymdb/plans/purchase`);

      const res = await fetch(`${API_BASE_URL}gymdb/plans/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      const order = await res.json();
      console.log('[BuyPlan] API Response:', {
        success: order.success,
        isCash: order.isCash,
        message: order.message,
        walletTransactionId: order.walletTransactionId
      });

      if (mode === 'cash') {
        if (!order.success) {
          console.error('[BuyPlan] Cash payment failed:', order.message);
          throw new Error(order.message || "Failed to initiate cash request");
        }
        console.log('[BuyPlan] Cash payment request successful, showing success modal');
        setCashRequestData(order);
        setShowSuccessModal(true);
        setLoading(false);
        console.log('========== BUY PLAN - CASH PAYMENT SUCCESS ==========\n');
        return;
      }

      if (!order.success) throw new Error("Failed to create Razorpay order");
      setWalletTransactionId(order.walletTransactionId);

      const paymentData = {
        key: order.key,
        amount: order.order.amount,
        currency: "INR",
        name: "GymsHood",
        description: `Purchase of ${plan.name}`,
        order_id: order.order.id,
        prefill: {
          name,
          email,
          contact: phone,
        },
        theme: {
          color: "#6C63FF",
        },
      };
      console.log("Payment Data", paymentData);

      setPaymentData(paymentData);
      setShowWebView(true);
    } catch (error: any) {
      console.error("[BuyPlan] Payment Error:", error);
      console.log('========== BUY PLAN - FAILED ==========\n');
      showAlert("Payment Error", error.message || "Something went wrong", "error");
      setLoading(false);
    }
  };

  const onNavigationStateChange = (navState: any): any => {
    const url = navState.url;
    if (url.includes("razorpay.com/payment/success")) {
      const successParams = new URLSearchParams(url.split("?")[1]);
      const paymentId = successParams.get("payment_id");
      const orderId = successParams.get("order_id");
      setShowWebView(false);
    } else if (url.includes("razorpay.com/payment/fail")) {
      showAlert("Payment Failed", "The payment was not successful", "error");
      setShowWebView(false);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (
    paymentId: string,
    orderId: string,
    razorpay_signature: string
  ) => {
    console.log("Hit payment success", paymentId, "\n and", orderId);
    try {
      const verifyRes = await fetch(
        `${API_BASE_URL}gymdb/plans/verifyPlanPayment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            planId: plan._id,
            razorpay_signature,
            walletTransactionId,
            gymId: gym._id,
          }),
        }
      );
      const verifyData = await verifyRes.json();
      console.log("Verification", verifyData);

      if (!verifyData.success) {
        throw new Error(verifyData.message || "Payment verification failed");
      }

      router.push({
        pathname: "/paymentConfirmation",
        params: {
          plan: JSON.stringify(plan),
          gym: JSON.stringify(gym),
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
        },
      });
    } catch (error: any) {
      console.error("Verification Error", error);
      showAlert("Error", error.message || "Payment verification failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateHtml = (paymentData: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=0.8">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <script>
          var options = ${JSON.stringify(paymentData)};
          options.handler = function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'payment-success',
              data: response
            }));
          };
          options.modal = {
            ondismiss: function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'payment-dismissed'
              }));
            }
          };
          
          var rzp = new Razorpay(options);
          rzp.open();
        </script>
      </body>
      </html>
    `;
  };

  const onMessage = (event: any) => {
    const message = JSON.parse(event.nativeEvent.data);
    console.log("Payment Message", message);
    if (message.type === "payment-success") {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        message.data;
      handlePaymentSuccess(
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      );
      setShowWebView(false);
    } else if (message.type === "payment-dismissed") {
      setShowWebView(false);
      setLoading(false);
      showAlert("Payment Cancelled", "The payment was cancelled by the user", "info");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#6C63FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Purchase Membership</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Plan Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.gymInfo}>
            {gym.media?.mediaUrl && (
              <Image
                source={{ uri: fixUrl(gym.media?.logoUrl || gym.media?.frontPhotoUrl || gym.media?.mediaUrls?.[0]) }}
                style={styles.gymImage}
              />
            )}
            <View style={styles.gymText}>
              <Text style={styles.gymName}>{gym.name}</Text>
              <Text style={styles.gymLocation}>
                {gym.location.address.split(",")[0]}
              </Text>
            </View>
          </View>

          <View style={styles.planDetails}>
            <Text style={styles.planName}>{plan.name}</Text>

            <View style={styles.priceContainer}>
              {plan.discountPercent > 0 ? (
                <View style={styles.priceRow}>
                  <Text style={styles.discountedPriceText}>₹{discountedPrice}</Text>
                  <Text style={styles.originalPriceText}>₹{plan.price}</Text>
                  <View style={styles.discountBadgeSmall}>
                    <Text style={styles.discountTextSmall}>{plan.discountPercent}% OFF</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.planPrice}>₹{plan.price}</Text>
              )}
            </View>

            <View style={styles.validityInfo}>
              <View style={styles.validityLabel}>
                <Ionicons name="calendar-outline" size={16} color="#6C63FF" />
                <Text style={styles.validityText}>For {plan.planType}</Text>
              </View>
              <Text style={styles.validitySubtext}>Valid for {getValidity(plan.planType)} days after activation</Text>
            </View>
          </View>
        </View>

        {/* User Details Form */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
          />

          <Text style={[styles.inputLabel, { marginTop: 15 }]}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter your email"
          />

          <Text style={[styles.inputLabel, { marginTop: 15 }]}>
            Phone Number
          </Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Enter your phone number"
          />
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreeTerms(!agreeTerms)}
          >
            <Ionicons
              name={agreeTerms ? "checkbox" : "square-outline"}
              size={20}
              color={agreeTerms ? "#6C63FF" : "#666"}
            />
          </TouchableOpacity>
          <Text style={styles.termsText}>
            I agree to the{" "}
            <Text style={styles.linkText} onPress={openTermsConditions}>
              Terms and Conditions
            </Text>{" "}
            and{" "}
            <Text style={styles.linkText} onPress={openPrivacyPolicy}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        {/* Policy Links */}
        <View style={styles.policyLinksContainer}>
          <Text style={styles.policyText}>
            By proceeding, you agree to our{" "}
          </Text>
          <TouchableOpacity onPress={openTermsConditions}>
            <Text style={styles.policyLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.policyText}> and </Text>
          <TouchableOpacity onPress={openPrivacyPolicy}>
            <Text style={styles.policyLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Purchase Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.purchaseButton, styles.enrollButton]}
            onPress={() => handlePurchase('cash')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonTextContainer}>
                <Text style={styles.purchaseButtonText}>Enroll Now</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal for Cash Request */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <FontAwesome5 name="clock" size={40} color="#FFA500" />
            </View>
            <Text style={styles.modalTitle}>Enrollment Request Sent!</Text>
            <Text style={styles.modalMessage}>
              Your enrollment request has been sent to the gym partner.
              Please visit the gym to confirm and activate your membership at the counter.
            </Text>
            <Text style={styles.modalSubMessage}>
              Status: Pending Gym Approval
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/(tabs)' as any); // Correcting route to the main tabs entry
              }}
            >
              <Text style={styles.modalButtonText}>Okay, Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showWebView && paymentData && (
        <View style={StyleSheet.absoluteFill}>
          <WebView
            ref={webViewRef}
            source={{ html: generateHtml(paymentData) }}
            onMessage={onMessage}
            onNavigationStateChange={onNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#6C63FF" />
              </View>
            )}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowWebView(false);
              setLoading(false);
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    paddingBottom: 100, // Increased for bottom button safety
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gymInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 15,
  },
  gymImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  gymText: {
    flex: 1,
  },
  gymName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  gymLocation: {
    fontSize: 14,
    color: "#666",
  },
  planDetails: {
    paddingHorizontal: 5,
  },
  planName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  priceContainer: {
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  originalPriceText: {
    fontSize: 16,
    color: "#999",
    textDecorationLine: "line-through",
  },
  discountedPriceText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6C63FF",
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6C63FF",
  },
  discountBadgeSmall: {
    backgroundColor: "#FFE8E8",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountTextSmall: {
    fontSize: 12,
    color: "#FF5252",
    fontWeight: "bold",
  },
  validityInfo: {
    backgroundColor: '#F8F9FE',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  validityLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  validityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textTransform: 'capitalize',
  },
  validitySubtext: {
    fontSize: 13,
    color: "#666",
    marginLeft: 22,
  },
  discountBadge: {
    // Hidden as we use discountBadgeSmall now
    display: 'none',
  },
  discountText: {
    fontSize: 12,
    color: "#FF5252",
    fontWeight: "500",
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  checkbox: {
    marginRight: 10,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  linkText: {
    color: "#6C63FF",
    fontWeight: "500",
  },
  policyLinksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  policyText: {
    color: "#666",
    fontSize: 12,
  },
  policyLink: {
    color: "#6C63FF",
    fontSize: 12,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 20,
  },
  purchaseButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    minHeight: 64,
  },
  enrollButton: {
    backgroundColor: "#6C63FF",
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: 'center',
  },
  buttonTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    elevation: 5
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22
  },
  modalSubMessage: {
    fontSize: 14,
    color: '#FFA500',
    fontWeight: '600',
    marginBottom: 25
  },
  modalButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%'
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default PurchasePlanScreen;
