import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Crown, X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import { useAppStore } from "../state/appStore";
import type { BillingPeriod, GetSubscriptionResponse } from "../../shared/contracts";

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const subscription = useAppStore((s) => s.subscription);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const [selectedPlan, setSelectedPlan] = useState<BillingPeriod>("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = subscription?.tier === "pro";

  const handleUpgrade = async () => {
    if (isPro) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.post("/api/subscription/upgrade", {
        billingPeriod: selectedPlan,
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

  return (
    <View className="flex-1 bg-[#0F0F1E]">
      {/* Header */}
      <View className="pt-14 px-6 pb-4 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold">Upgrade to Pro</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <X size={24} color="#F0F0F5" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Current Status */}
        {isPro && (
          <View className="mx-6 mb-6 p-4 bg-purple-900/30 border border-purple-500/50 rounded-2xl">
            <View className="flex-row items-center mb-2">
              <Crown size={20} color="#F59E0B" />
              <Text className="text-white font-semibold text-lg ml-2">Pro Member</Text>
            </View>
            <Text className="text-gray-300 text-sm">
              You&apos;re already enjoying all Pro features!
            </Text>
          </View>
        )}

        {/* Free vs Pro Comparison */}
        <View className="mx-6 mb-6">
          <Text className="text-gray-400 text-sm uppercase tracking-wide mb-4">
            Choose Your Plan
          </Text>

          {/* Free Tier */}
          <View className="bg-[#1A1A2E] rounded-2xl p-6 mb-4 border border-gray-700">
            <Text className="text-white text-xl font-bold mb-2">Free</Text>
            <Text className="text-gray-400 text-sm mb-4">Try the basics</Text>

            <View className="space-y-3">
              <FeatureItem text="1 custom session/month" included />
              <FeatureItem text="2 standard voices" included />
              <FeatureItem text="All preloaded sessions" included />
              <FeatureItem text="Unlimited AI sessions" included={false} />
              <FeatureItem text="Premium voices (Whisper)" included={false} />
            </View>

            <Text className="text-white text-3xl font-bold mt-6">$0</Text>
          </View>

          {/* Pro Tier */}
          <LinearGradient
            colors={["#9333EA", "#F59E0B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-[2px]"
          >
            <View className="bg-[#1A1A2E] rounded-2xl p-6">
              <View className="flex-row items-center mb-2">
                <Crown size={24} color="#F59E0B" />
                <Text className="text-white text-xl font-bold ml-2">Pro</Text>
              </View>
              <Text className="text-gray-400 text-sm mb-4">Unlock everything</Text>

              <View className="space-y-3">
                <FeatureItem text="Unlimited custom sessions" included />
                <FeatureItem text="All premium voices" included />
                <FeatureItem text="All preloaded sessions" included />
                <FeatureItem text="Priority support" included />
                <FeatureItem text="Early access to new features" included />
              </View>

              {/* Billing Toggle */}
              <View className="mt-6 mb-4">
                <View className="flex-row bg-black/30 rounded-xl p-1">
                  <TouchableOpacity
                    onPress={() => setSelectedPlan("monthly")}
                    className={`flex-1 py-3 rounded-lg ${
                      selectedPlan === "monthly" ? "bg-purple-600" : ""
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        selectedPlan === "monthly" ? "text-white" : "text-gray-400"
                      }`}
                    >
                      Monthly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedPlan("yearly")}
                    className={`flex-1 py-3 rounded-lg ${
                      selectedPlan === "yearly" ? "bg-purple-600" : ""
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        selectedPlan === "yearly" ? "text-white" : "text-gray-400"
                      }`}
                    >
                      Yearly
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Price */}
              <View>
                {selectedPlan === "monthly" ? (
                  <>
                    <Text className="text-white text-3xl font-bold">
                      $6.99<Text className="text-lg text-gray-400">/month</Text>
                    </Text>
                    <Text className="text-gray-400 text-sm mt-1">Billed monthly</Text>
                  </>
                ) : (
                  <>
                    <Text className="text-white text-3xl font-bold">
                      $49.99<Text className="text-lg text-gray-400">/year</Text>
                    </Text>
                    <Text className="text-green-400 text-sm mt-1 font-semibold">
                      Save $34 (40% off)
                    </Text>
                  </>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Error Message */}
        {error && (
          <View className="mx-6 mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {/* CTA Button */}
        {!isPro && (
          <View className="mx-6">
            <TouchableOpacity
              onPress={handleUpgrade}
              disabled={isLoading}
              className="overflow-hidden rounded-2xl"
            >
              <LinearGradient
                colors={["#9333EA", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-4"
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center text-lg font-bold">
                    Upgrade to Pro
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text className="text-gray-400 text-xs text-center mt-4">
              Cancel anytime. No hidden fees.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FeatureItem({ text, included }: { text: string; included: boolean }) {
  return (
    <View className="flex-row items-center">
      {included ? (
        <Check size={20} color="#10B981" />
      ) : (
        <X size={20} color="#6B7280" />
      )}
      <Text
        className={`ml-3 ${
          included ? "text-white" : "text-gray-500 line-through"
        }`}
      >
        {text}
      </Text>
    </View>
  );
}
