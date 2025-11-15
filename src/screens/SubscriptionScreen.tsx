import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Crown, X, Sparkles } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import { useAppStore } from "../state/appStore";
import type { BillingPeriod, GetSubscriptionResponse } from "../../shared/contracts";

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const subscription = useAppStore((s) => s.subscription);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const userName = useAppStore((s) => s.userName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = subscription?.tier === "pro";

  const handleUpgrade = async () => {
    if (isPro) return;

    setIsLoading(true);
    setError(null);

    try {
      // For one-time purchase, use "yearly" as the billing period
      // The backend should handle one-time purchases separately
      await api.post("/api/subscription/upgrade", {
        billingPeriod: "yearly", // One-time purchase treated as yearly
      });

      // Refresh subscription status
      const data = await api.get<GetSubscriptionResponse>("/api/subscription");
      setSubscription(data);

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Benefits to display (stacked for visual impact)
  const benefits = [
    "Unlimited custom sessions",
    "All voices (Neutral, Confident, Whisper)",
    "All background sounds (Rain, Brown Noise, Ocean, Forest, Wind, Fire, Thunder)",
    "All frequencies (Delta, Theta, Alpha, Beta, Gamma)",
    "Sleep sessions",
    "Focus sessions",
    "Calm sessions",
    "Manifest sessions",
    "Library builder",
    "Save favorites",
    "Unlimited playback length",
    "Unlimited affirmations per session",
  ];

  return (
    <LinearGradient colors={["#0F0F1E", "#1A1A2E"]} style={{ flex: 1 }}>
      {/* Header */}
      <View className="pt-14 px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-1" />
        <Pressable onPress={() => navigation.goBack()} className="p-2 -mr-2">
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
          </Animated.View>
        )}

        {/* Hero Section */}
        {!isPro && (
          <Animated.View entering={FadeIn.duration(600)} className="items-center mb-8">
            <View className="bg-purple-500/20 rounded-full p-4 mb-4">
              <Sparkles size={32} color="#9333EA" strokeWidth={2} />
            </View>
            <Text className="text-white text-4xl font-bold text-center mb-3">
              {userName ? `Unlock Everything Forever, ${userName}` : "Unlock Everything Forever"}
            </Text>
            <Text className="text-gray-400 text-lg text-center mb-2">
              One payment. No subscription. No limits.
            </Text>
          </Animated.View>
        )}

        {/* Price Display */}
        {!isPro && (
          <Animated.View entering={FadeIn.delay(200).duration(600)} className="items-center mb-8">
            <View className="flex-row items-baseline">
              <Text className="text-white text-6xl font-bold">$9.99</Text>
            </View>
            <Text className="text-gray-400 text-base mt-2">
              One-time payment • Lifetime access
            </Text>
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
        {error && (
          <Animated.View entering={FadeIn.duration(300)} className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
            <Text className="text-red-400 text-sm text-center">{error}</Text>
          </Animated.View>
        )}

        {/* CTA Button */}
        {!isPro && (
          <Animated.View entering={FadeIn.delay(800).duration(600)} className="mb-6">
            <Pressable
              onPress={handleUpgrade}
              disabled={isLoading}
              className="active:opacity-80"
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
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-xl font-bold">
                    Get Full Access – $9.99
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Text className="text-gray-500 text-xs text-center mt-4">
              Secure payment • No recurring charges
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
                  Why choose lifetime access?
                </Text>
              </View>
              <View className="mb-2">
                <Text className="text-gray-300 text-sm leading-6">
                  • No monthly subscriptions or recurring fees
                </Text>
              </View>
              <View className="mb-2">
                <Text className="text-gray-300 text-sm leading-6">
                  • All future features included at no extra cost
                </Text>
              </View>
              <View>
                <Text className="text-gray-300 text-sm leading-6">
                  • One payment, unlimited access forever
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Free Plan Info (if not Pro) */}
        {!isPro && (
          <Animated.View entering={FadeIn.delay(1000).duration(600)} className="mb-6">
            <View className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Text className="text-gray-400 text-sm text-center leading-6">
                Free plan includes: 1 custom session/month, 2 standard voices, and all preloaded sessions
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

