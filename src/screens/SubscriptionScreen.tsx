import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Crown, X, Sparkles, RefreshCw } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import { useAppStore } from "../state/appStore";
import type { BillingPeriod, GetSubscriptionResponse } from "../../shared/contracts";
import { useInAppPurchases } from "@/hooks/useInAppPurchases";

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const subscription = useAppStore((s) => s.subscription);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const userName = useAppStore((s) => s.userName);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual"); // Default to annual

  const {
    isInitialized,
    isLoading: isIAPLoading,
    error: iapError,
    products,
    hasPurchased: hasIAPPurchased,
    purchase,
    restore,
    isAvailable: isIAPAvailable,
  } = useInAppPurchases();

  const isPro = subscription?.tier === "pro" || hasIAPPurchased;

  // Sync IAP purchase status with backend
  useEffect(() => {
    if (hasIAPPurchased && !isPro && !isVerifying) {
      verifyPurchaseWithBackend();
    }
  }, [hasIAPPurchased, isPro]);

  const verifyPurchaseWithBackend = async (productId?: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      // Determine product ID from purchase or selected plan
      const finalProductId = productId || (selectedPlan === "monthly" ? "com.recenter.pro.monthly" : "com.recenter.pro.annual");
      
      // Verify purchase with backend
      await api.post("/api/subscription/verify-purchase", {
        productId: finalProductId,
        platform: Platform.OS,
      });

      // Refresh subscription status
      const data = await api.get<GetSubscriptionResponse>("/api/subscription");
      setSubscription(data);
    } catch (err) {
      console.error("[Subscription] Failed to verify purchase:", err);
      setError("Failed to verify purchase. Please try restoring purchases.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpgrade = async (billingPeriod: "monthly" | "annual") => {
    if (isPro) return;

    if (!isIAPAvailable) {
      Alert.alert(
        "Purchases Not Available",
        "In-app purchases are not available on this platform. Please use the web version or a mobile device.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!isInitialized) {
      Alert.alert(
        "Loading",
        "Please wait while we connect to the store...",
        [{ text: "OK" }]
      );
      return;
    }

    setError(null);
    setSelectedPlan(billingPeriod);

    try {
      // Initiate purchase through IAP
      await purchase(billingPeriod);

      // Verify with backend
      await verifyPurchaseWithBackend();

      Alert.alert(
        "Subscription Active!",
        `Thank you for upgrading to Pro ${billingPeriod === "annual" ? "Annual" : "Monthly"}! You now have unlimited access to all features.`,
        [
          {
            text: "OK",
            onPress: () => {
              // Check if we can go back, otherwise navigate to home
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.replace("Tabs", { screen: "HomeTab" });
              }
            },
          },
        ]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Purchase failed";
      setError(errorMessage);
      
      // Don't show alert for user cancellation
      if (!errorMessage.includes("cancel") && !errorMessage.includes("Cancel")) {
        Alert.alert("Purchase Failed", errorMessage, [{ text: "OK" }]);
      }
    }
  };

  const handleRestore = async () => {
    setError(null);

    try {
      const restored = await restore();
      
      if (restored) {
        await verifyPurchaseWithBackend();
        Alert.alert(
          "Purchases Restored",
          "Your previous purchase has been restored!",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases to restore.",
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Restore failed";
      setError(errorMessage);
      Alert.alert("Restore Failed", errorMessage, [{ text: "OK" }]);
    }
  };

  // Benefits to display
  const benefits = [
    "Unlimited custom AI-generated sessions",
    "All 3 voices (Neutral, Confident, Whisper)",
    "All 8 background sounds",
    "All binaural frequencies (Delta, Theta, Alpha, Beta, Gamma)",
    "Sessions up to 30+ minutes",
    "Priority AI generation",
    "Early access to new features",
    "Priority customer support",
  ];

  const monthlyPrice = products.monthly?.price || "$9.99";
  const annualPrice = products.annual?.price || "$99.99";
  const monthlySavings = "$20"; // $9.99 * 12 = $119.88, $99.99 saves $19.89 ≈ $20

  return (
    <LinearGradient colors={["#0F0F1E", "#1A1A2E"]} style={{ flex: 1 }}>
      {/* Header */}
      <View className="pt-14 px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-1" />
        <Pressable 
          onPress={() => {
            // Check if we can go back, otherwise navigate to home
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.replace("Tabs", { screen: "HomeTab" });
            }
          }} 
          className="p-2 -mr-2"
        >
          <X size={24} color="#F0F0F5" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        {isPro && (
          <Animated.View entering={FadeIn.duration(600)} className="mb-6 p-6 bg-purple-900/30 border border-purple-500/50 rounded-2xl">
            <View className="flex-row items-center mb-2">
              <Crown size={24} color="#F59E0B" />
              <Text className="text-white font-semibold text-xl ml-3">Pro Member</Text>
            </View>
            <Text className="text-gray-300 text-base">
              You&apos;re already enjoying all Pro features!
            </Text>
            {subscription?.billingPeriod && (
              <Text className="text-gray-400 text-sm mt-2">
                {subscription.billingPeriod === "annual" ? "Annual" : "Monthly"} subscription
                {subscription.currentPeriodEnd && (
                  <> • Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
              </Text>
            )}
          </Animated.View>
        )}

        {/* Hero Section */}
        {!isPro && (
          <Animated.View entering={FadeIn.duration(600)} className="items-center mb-8">
            <View className="bg-purple-500/20 rounded-full p-4 mb-4">
              <Sparkles size={32} color="#9333EA" strokeWidth={2} />
            </View>
            <Text className="text-white text-4xl font-bold text-center mb-3">
              {userName ? `Upgrade to Pro, ${userName}` : "Upgrade to Pro"}
            </Text>
            <Text className="text-gray-400 text-lg text-center mb-2">
              Unlimited AI-generated affirmations
            </Text>
          </Animated.View>
        )}

        {/* Pricing Options */}
        {!isPro && (
          <Animated.View entering={FadeIn.delay(200).duration(600)} className="mb-8">
            {/* Annual Plan (Highlighted) */}
            <Pressable
              onPress={() => setSelectedPlan("annual")}
              className="mb-4 active:opacity-80"
            >
              <View className={`bg-white/10 rounded-2xl p-6 border-2 ${
                selectedPlan === "annual" ? "border-purple-500" : "border-white/20"
              }`}>
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-white text-2xl font-bold mr-2">Annual</Text>
                      <View className="bg-green-500/20 px-2 py-1 rounded">
                        <Text className="text-green-400 text-xs font-semibold">SAVE {monthlySavings}</Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-sm">Just $8.33/month</Text>
                  </View>
                  <Text className="text-white text-3xl font-bold">{annualPrice}</Text>
                </View>
                {selectedPlan === "annual" && (
                  <View className="mt-2">
                    <Text className="text-purple-400 text-sm">✓ Best Value</Text>
                  </View>
                )}
              </View>
            </Pressable>

            {/* Monthly Plan */}
            <Pressable
              onPress={() => setSelectedPlan("monthly")}
              className="active:opacity-80"
            >
              <View className={`bg-white/10 rounded-2xl p-6 border-2 ${
                selectedPlan === "monthly" ? "border-purple-500" : "border-white/20"
              }`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white text-2xl font-bold mb-1">Monthly</Text>
                    <Text className="text-gray-400 text-sm">Billed monthly</Text>
                  </View>
                  <Text className="text-white text-3xl font-bold">{monthlyPrice}</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Benefits Stack */}
        {!isPro && (
          <Animated.View entering={FadeIn.delay(300).duration(600)} className="mb-8">
            <Text className="text-white text-xl font-bold mb-6 text-center">
              Everything you unlock:
            </Text>
            
            <View className="bg-white/5 rounded-2xl p-6 border border-white/10">
              {benefits.map((benefit, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(400 + index * 50).duration(400)}
                  className="flex-row items-center mb-4 last:mb-0"
                >
                  <View className="w-6 h-6 rounded-full bg-purple-500/20 items-center justify-center mr-3">
                    <Check size={16} color="#9333EA" strokeWidth={3} />
                  </View>
                  <Text className="text-white text-base flex-1 leading-6">
                    {benefit}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Error Message */}
        {(error || iapError) && (
          <Animated.View entering={FadeIn.duration(300)} className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
            <Text className="text-red-400 text-sm text-center">{error || iapError}</Text>
          </Animated.View>
        )}

        {/* CTA Buttons */}
        {!isPro && (
          <Animated.View entering={FadeIn.delay(800).duration(600)} className="mb-6">
            <Pressable
              onPress={() => handleUpgrade(selectedPlan)}
              disabled={isIAPLoading || isVerifying || !isInitialized}
              className="active:opacity-80 mb-3"
            >
              <LinearGradient
                colors={["#9333EA", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  paddingVertical: 20,
                  alignItems: "center",
                  shadowColor: "#9333EA",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 12,
                  opacity: (isIAPLoading || isVerifying || !isInitialized) ? 0.6 : 1,
                }}
              >
                {(isIAPLoading || isVerifying) ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-xl font-bold">
                    Subscribe to Pro {selectedPlan === "annual" ? "Annual" : "Monthly"}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleRestore}
              disabled={isIAPLoading || isVerifying}
              className="mb-3 active:opacity-80"
            >
              <View className="flex-row items-center justify-center">
                <RefreshCw size={16} color="#9E9EB0" />
                <Text className="text-gray-400 text-sm ml-2">
                  Restore Purchases
                </Text>
              </View>
            </Pressable>

            <Text className="text-gray-500 text-xs text-center">
              Secure payment via {Platform.OS === "ios" ? "Apple" : "Google"} • Cancel anytime
            </Text>
          </Animated.View>
        )}

        {/* Value Proposition */}
        {!isPro && (
          <Animated.View entering={FadeIn.delay(900).duration(600)} className="mb-6">
            <View className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <View className="flex-row items-center mb-3">
                <Crown size={20} color="#F59E0B" />
                <Text className="text-white text-lg font-semibold ml-2">
                  Why choose Pro?
                </Text>
              </View>
              <View className="mb-2">
                <Text className="text-gray-300 text-sm leading-6">
                  • Generate unlimited personalized affirmations
                </Text>
              </View>
              <View className="mb-2">
                <Text className="text-gray-300 text-sm leading-6">
                  • Extended sessions up to 30+ minutes
                </Text>
              </View>
              <View>
                <Text className="text-gray-300 text-sm leading-6">
                  • Priority support and early access to new features
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Free Plan Info */}
        {!isPro && (
          <Animated.View entering={FadeIn.delay(1000).duration(600)} className="mb-6">
            <View className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Text className="text-gray-400 text-sm text-center leading-6">
                Free plan includes: 3 custom sessions/month, all voices, all background sounds, and all 8 default sessions
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
