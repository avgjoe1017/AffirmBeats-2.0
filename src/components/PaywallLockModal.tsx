import React, { useEffect } from "react";
import { View, Text, Modal, Pressable, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Crown } from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { MODAL_INITIAL_SCALE, MODAL_FINAL_SCALE, MODAL_SCALE_DURATION, MODAL_EASING, FADE_OUT_DURATION, STANDARD_EASING } from "@/lib/animations";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PaywallLockModalProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

/**
 * Paywall Lock Modal Component
 * 
 * Bottom sheet modal that appears when user taps a locked feature
 * Shows "This feature is included in the full version" with unlock button
 */
const PaywallLockModal: React.FC<PaywallLockModalProps> = ({
  visible,
  onClose,
  featureName,
}) => {
  const navigation = useNavigation<NavigationProp>();

  // Modal scale animation (0.97 → 1.0 over 180ms)
  const scale = useSharedValue(MODAL_INITIAL_SCALE);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Animate in: scale from 0.97 to 1.0, opacity from 0 to 1
      scale.value = withTiming(MODAL_FINAL_SCALE, {
        duration: MODAL_SCALE_DURATION,
        easing: MODAL_EASING,
      });
      opacity.value = withTiming(1, {
        duration: MODAL_SCALE_DURATION,
        easing: MODAL_EASING,
      });
    } else {
      // Animate out: scale to 0.97, opacity to 0
      scale.value = withTiming(MODAL_INITIAL_SCALE, {
        duration: FADE_OUT_DURATION,
        easing: STANDARD_EASING,
      });
      opacity.value = withTiming(0, {
        duration: FADE_OUT_DURATION,
        easing: STANDARD_EASING,
      });
    }
  }, [visible, scale, opacity]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.7, // 70% opacity for overlay
  }));

  const handleUnlock = () => {
    onClose();
    navigation.navigate("Subscription");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[{ flex: 1, justifyContent: "flex-end" }, animatedOverlayStyle]}>
        <Pressable className="flex-1 bg-black/70" onPress={onClose}>
          <View />
        </Pressable>

        <Animated.View
          style={[
            {
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            },
            animatedModalStyle,
          ]}
        >
          <LinearGradient
            colors={["#1A1A2E", "#0F0F1E"]}
            style={{
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingTop: 24,
              paddingBottom: 40,
              paddingHorizontal: 24,
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <Crown size={24} color="#F59E0B" />
                <Text className="text-white text-2xl font-bold ml-3">
                  Premium Feature
                </Text>
              </View>
              <Pressable onPress={onClose} className="active:opacity-70">
                <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                  <X size={20} color="#FFF" />
                </View>
              </Pressable>
            </View>

            {/* Content */}
            <View className="mb-6">
              {featureName && (
                <Text className="text-white text-lg font-semibold mb-2">
                  {featureName}
                </Text>
              )}
              <Text className="text-gray-300 text-base leading-6">
                This feature is included in the full version.
              </Text>
            </View>

            {/* Benefits Preview */}
            <View className="mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
              <Text className="text-white text-sm font-semibold mb-3">
                Unlock everything:
              </Text>
              <View>
                <View className="flex-row items-center mb-2">
                  <Text className="text-gray-300 text-sm">• Unlimited custom sessions</Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Text className="text-gray-300 text-sm">• All premium voices</Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Text className="text-gray-300 text-sm">• All background sounds</Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Text className="text-gray-300 text-sm">• Unlimited session length</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-gray-300 text-sm">• Unlimited affirmations</Text>
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <Pressable onPress={handleUnlock} className="active:opacity-80 mb-3">
              <LinearGradient
                colors={["#9333EA", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  shadowColor: "#9333EA",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Text className="text-white text-lg font-bold">
                  Unlock Everything
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Secondary Button */}
            <TouchableOpacity onPress={onClose} className="active:opacity-70">
              <Text className="text-gray-400 text-center text-sm font-medium">
                Not now
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default PaywallLockModal;

