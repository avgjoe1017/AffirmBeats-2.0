import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Crown } from "lucide-react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Day3ConversionBannerProps {
  userName?: string;
  onDismiss: () => void;
}

/**
 * Day 3 Conversion Banner (Headspace Style)
 * 
 * Gentle upgrade hint after 3 days of usage
 * Shows once, never again after dismissing
 */
const Day3ConversionBanner: React.FC<Day3ConversionBannerProps> = ({
  userName,
  onDismiss,
}) => {
  const navigation = useNavigation<NavigationProp>();

  const handleUnlock = () => {
    onDismiss();
    navigation.navigate("Subscription");
  };

  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      exiting={FadeOutDown.duration(300)}
      className="mx-6 mb-4"
    >
      <LinearGradient
        colors={["#9333EA", "#F59E0B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 20,
          shadowColor: "#9333EA",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Close Button */}
        <Pressable
          onPress={handleDismiss}
          className="absolute top-3 right-3 z-10 active:opacity-70"
        >
          <View className="w-7 h-7 rounded-full bg-white/20 items-center justify-center">
            <X size={16} color="#FFF" />
          </View>
        </Pressable>

        {/* Content */}
        <View className="pr-8">
          <View className="flex-row items-center mb-3">
            <Crown size={20} color="#F59E0B" />
            <Text className="text-white text-lg font-bold ml-2">
              Your sessions are working beautifully{userName ? `, ${userName}` : ""}.
            </Text>
          </View>
          <Text className="text-white/90 text-base mb-4">
            Want unlimited?
          </Text>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleUnlock}
              className="flex-1 active:opacity-80"
            >
              <View className="bg-white rounded-xl py-3 px-4 items-center">
                <Text className="text-gray-900 text-base font-bold">
                  Unlock Everything
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={handleDismiss}
              className="flex-1 active:opacity-80"
            >
              <View className="bg-white/20 rounded-xl py-3 px-4 items-center border border-white/30">
                <Text className="text-white text-base font-semibold">
                  Not now
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default Day3ConversionBanner;

