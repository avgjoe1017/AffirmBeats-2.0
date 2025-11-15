import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Modal, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Volume2, Wind, Clock, ChevronDown, Timer, Check, X, Crown, ChevronRight, RotateCcw } from "lucide-react-native";
import Animated from "react-native-reanimated";
import { standardFadeIn, fadeInWithDelay } from "@/lib/animations";
import type { BottomTabScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/appStore";
import LockIcon from "@/components/LockIcon";
import PaywallLockModal from "@/components/PaywallLockModal";

type Props = BottomTabScreenProps<"SettingsTab">;

const SettingsScreen = ({ navigation }: Props) => {
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const subscription = useAppStore((s) => s.subscription);
  const setHasCompletedOnboarding = useAppStore((s) => s.setHasCompletedOnboarding);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState<string | undefined>(undefined);

  const updatePreference = async (updates: Partial<typeof preferences>) => {
    setPreferences({ ...preferences, ...updates });
  };

  const voices = [
    { value: "neutral" as const, label: "Neutral", description: "Calm and balanced tone", isPremium: false },
    { value: "confident" as const, label: "Confident", description: "Strong and empowering", isPremium: false },
    { value: "whisper" as const, label: "Whisper", description: "Soft and soothing", isPremium: true },
  ];

  const backgrounds = [
    { value: "none" as const, label: "None", description: "Pure silence", isPremium: false },
    { value: "rain" as const, label: "Rain", description: "Gentle rainfall", isPremium: false },
    { value: "brown" as const, label: "Brown Noise", description: "Deep rumbling", isPremium: true },
    { value: "ocean" as const, label: "Ocean Waves", description: "Coastal sounds", isPremium: true },
    { value: "forest" as const, label: "Forest", description: "Nature ambience", isPremium: true },
    { value: "wind" as const, label: "Wind Chimes", description: "Peaceful chimes", isPremium: true },
    { value: "fire" as const, label: "Fireplace", description: "Crackling fire", isPremium: true },
    { value: "thunder" as const, label: "Distant Thunder", description: "Rolling thunder", isPremium: true },
  ];

  const durations = [
    { value: 180, label: "3 min", isPremium: false },
    { value: 1800, label: "30 min", isPremium: true },
    { value: -1, label: "Unlimited", isPremium: true },
  ];

  const spacingOptions = [3, 5, 8, 10, 15, 20, 30];

  const selectedVoice = voices.find(v => v.value === preferences.voice) || voices[0];
  const selectedBackground = backgrounds.find(b => b.value === preferences.noise) || backgrounds[0];
  const isSelectedBackgroundPremium = selectedBackground?.isPremium && subscription?.tier !== "pro";
  const currentSpacing = preferences.affirmationSpacing || 8;

  return (
    <LinearGradient colors={["#0F0F1E", "#1A1A2E"]} style={{ flex: 1 }}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Animated.View entering={standardFadeIn} className="mt-8 mb-8">
          <Text className="text-white text-3xl font-bold">Settings</Text>
          <Text className="text-gray-400 text-base mt-2">Personalize your experience</Text>
        </Animated.View>

        {/* Subscription Card */}
        <Animated.View entering={fadeInWithDelay(50)} className="mb-6">
          <Pressable
            onPress={() => navigation.navigate("Subscription")}
            className="active:opacity-80"
          >
            {subscription?.tier === "pro" ? (
              <LinearGradient
                colors={["#9333EA", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl p-[2px]"
              >
                <View className="bg-[#1A1A2E] rounded-2xl p-4 flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Crown size={24} color="#F59E0B" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white text-lg font-bold">Pro Member</Text>
                      <Text className="text-gray-400 text-sm">Unlimited custom sessions</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#9E9EB0" />
                </View>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={["#8B7AB8", "#6B5A98"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-2xl p-[2px]"
              >
                <View className="bg-[#1A1A2E] rounded-2xl p-4 flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Crown size={24} color="#F59E0B" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white text-lg font-bold">Free Plan</Text>
                      <Text className="text-gray-300 text-sm">
                        {subscription?.customSessionsUsedThisMonth || 0} of {subscription?.customSessionsLimit || 1} custom sessions used
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#FFF" />
                </View>
              </LinearGradient>
            )}
          </Pressable>
        </Animated.View>

        {/* Voice Selector */}
        <Animated.View entering={fadeInWithDelay(100)} className="mb-6">
          <View className="flex-row items-center mb-3">
            <Volume2 size={20} color="#8B7AB8" />
            <Text className="text-white text-lg font-semibold ml-2">Voice</Text>
          </View>
          <Pressable
            onPress={() => setShowVoiceModal(true)}
            className="active:opacity-80"
          >
            <View className="bg-white/10 rounded-xl p-4 flex-row items-center justify-between border border-white/20 relative">
              <View className="flex-1">
                <Text className="text-white text-base font-medium">{selectedVoice.label}</Text>
                <Text className="text-gray-400 text-sm mt-1">{selectedVoice.description}</Text>
              </View>
              <ChevronDown size={20} color="#9E9EB0" />
              {selectedVoice.isPremium && subscription?.tier !== "pro" && (
                <LockIcon size={14} placement="top-right" />
              )}
            </View>
          </Pressable>
        </Animated.View>

        {/* Background Selector */}
        <Animated.View entering={fadeInWithDelay(200)} className="mb-6">
          <View className="flex-row items-center mb-3">
            <Wind size={20} color="#8B7AB8" />
            <Text className="text-white text-lg font-semibold ml-2">Background Sound</Text>
          </View>
          <Pressable
            onPress={() => setShowBackgroundModal(true)}
            className="active:opacity-80"
          >
            <View className="bg-white/10 rounded-xl p-4 flex-row items-center justify-between border border-white/20 relative">
              <View className="flex-1">
                <Text className="text-white text-base font-medium">{selectedBackground.label}</Text>
                <Text className="text-gray-400 text-sm mt-1">{selectedBackground.description}</Text>
              </View>
              <ChevronDown size={20} color="#9E9EB0" />
              {/* Lock icon for premium sounds */}
              {isSelectedBackgroundPremium && (
                <LockIcon size={14} placement="top-right" />
              )}
            </View>
          </Pressable>
        </Animated.View>

        {/* Duration */}
        <Animated.View entering={fadeInWithDelay(300)} className="mb-6">
          <View className="flex-row items-center mb-2">
            <Clock size={20} color="#8B7AB8" />
            <Text className="text-white text-lg font-semibold ml-2">Session Duration</Text>
          </View>
          <Text className="text-gray-500 text-sm mb-3">Select duration</Text>
          <View className="flex-row gap-3">
            {durations.map((duration) => {
              const isLocked = duration.isPremium && subscription?.tier !== "pro";
              return (
                <Pressable
                  key={duration.value}
                  onPress={() => {
                    if (isLocked) {
                      setLockedFeatureName(`Session Duration: ${duration.label}`);
                      setShowPaywallModal(true);
                    } else {
                      updatePreference({ duration: duration.value });
                    }
                  }}
                  className="flex-1 active:opacity-80"
                >
                  <View
                    className={`py-3 px-4 rounded-xl border-2 relative ${
                      preferences.duration === duration.value
                        ? "bg-purple-500/20 border-purple-400"
                        : "bg-white/5 border-white/10"
                    } ${isLocked ? "opacity-60" : ""}`}
                  >
                    <Text
                      className={`text-center font-medium ${
                        preferences.duration === duration.value ? "text-purple-300" : "text-gray-400"
                      }`}
                    >
                      {duration.label}
                    </Text>
                    {isLocked && (
                      <LockIcon size={12} placement="top-right" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Affirmation Spacing */}
        <Animated.View entering={fadeInWithDelay(400)} className="mb-6">
          <View className="flex-row items-center mb-3">
            <Timer size={20} color="#8B7AB8" />
            <Text className="text-white text-lg font-semibold ml-2">Seconds Between Affirmations</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {spacingOptions.map((seconds) => (
              <Pressable
                key={seconds}
                onPress={() => updatePreference({ affirmationSpacing: seconds })}
                className="active:opacity-80"
              >
                <View
                  className={`py-3 px-5 rounded-xl border-2 ${
                    currentSpacing === seconds
                      ? "bg-purple-500/20 border-purple-400"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      currentSpacing === seconds ? "text-purple-300" : "text-gray-400"
                    }`}
                  >
                    {seconds}s
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Reset Onboarding */}
        {hasCompletedOnboarding && (
          <Animated.View entering={fadeInWithDelay(500)} className="mb-6">
            <View className="flex-row items-center mb-3">
              <RotateCcw size={20} color="#8B7AB8" />
              <Text className="text-white text-lg font-semibold ml-2">Onboarding</Text>
            </View>
            <Pressable
              onPress={() => {
                Alert.alert(
                  "Reset Onboarding",
                  "This will take you back to the onboarding screen. Your preferences and sessions will be preserved.",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Reset",
                      style: "destructive",
                      onPress: () => {
                        setHasCompletedOnboarding(false);
                        // Navigate to onboarding by resetting the root navigation stack
                        const rootNavigation = navigation.getParent();
                        if (rootNavigation) {
                          rootNavigation.reset({
                            index: 0,
                            routes: [{ name: "Onboarding" }],
                          });
                        }
                      },
                    },
                  ]
                );
              }}
              className="active:opacity-80"
            >
              <View className="bg-white/10 rounded-xl p-4 flex-row items-center justify-between border border-white/20">
                <View className="flex-1">
                  <Text className="text-white text-base font-medium">Reset Onboarding</Text>
                  <Text className="text-gray-400 text-sm mt-1">See the onboarding flow again</Text>
                </View>
                <ChevronRight size={20} color="#9E9EB0" />
              </View>
            </Pressable>
          </Animated.View>
        )}

        <View className="h-32" />
      </ScrollView>

      {/* Voice Modal */}
      <Modal
        visible={showVoiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#1A1A2E] rounded-t-3xl p-6 pb-8">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Select Voice</Text>
              <Pressable onPress={() => setShowVoiceModal(false)}>
                <X size={24} color="#9E9EB0" />
              </Pressable>
            </View>
            {voices.map((voice, index) => {
              const isLocked = voice.isPremium && subscription?.tier !== "pro";
              return (
                <Pressable
                  key={voice.value}
                  onPress={() => {
                    if (isLocked) {
                      setShowVoiceModal(false);
                      setLockedFeatureName(`${voice.label} Voice`);
                      setShowPaywallModal(true);
                    } else {
                      updatePreference({ voice: voice.value });
                      setShowVoiceModal(false);
                    }
                  }}
                  className="active:opacity-80"
                >
                  <View className={`py-4 px-4 rounded-xl mb-3 ${
                    preferences.voice === voice.value ? "bg-purple-500/20" : "bg-white/5"
                  } ${isLocked ? "opacity-60" : ""}`}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 flex-row items-center">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-white text-base font-medium">{voice.label}</Text>
                            {voice.isPremium && (
                              <View className="ml-2 px-2 py-0.5 bg-purple-600/30 rounded-md">
                                <Text className="text-purple-400 text-xs font-semibold">PRO</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-400 text-sm mt-1">{voice.description}</Text>
                        </View>
                      </View>
                      {preferences.voice === voice.value && !isLocked && (
                        <Check size={20} color="#A78BFA" />
                      )}
                      {isLocked && (
                        <Crown size={20} color="#9E9EB0" />
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Background Modal */}
      <Modal
        visible={showBackgroundModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBackgroundModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#1A1A2E] rounded-t-3xl p-6 pb-8">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Select Background</Text>
              <Pressable onPress={() => setShowBackgroundModal(false)}>
                <X size={24} color="#9E9EB0" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {backgrounds.map((bg, index) => {
                const isLocked = bg.isPremium && subscription?.tier !== "pro";
                return (
                  <Pressable
                    key={bg.value}
                    onPress={() => {
                      if (isLocked) {
                        setShowBackgroundModal(false);
                        setLockedFeatureName(`${bg.label} Background Sound`);
                        setShowPaywallModal(true);
                      } else {
                        updatePreference({ noise: bg.value });
                        setShowBackgroundModal(false);
                      }
                    }}
                    className="active:opacity-80"
                  >
                    <View className={`py-4 px-4 rounded-xl mb-3 relative ${
                      preferences.noise === bg.value ? "bg-purple-500/20" : "bg-white/5"
                    } ${isLocked ? "opacity-60" : ""}`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-white text-base font-medium">{bg.label}</Text>
                            {bg.isPremium && (
                              <View className="ml-2 px-2 py-0.5 bg-purple-600/30 rounded-md">
                                <Text className="text-purple-400 text-xs font-semibold">PRO</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-400 text-sm mt-1">{bg.description}</Text>
                        </View>
                        {preferences.noise === bg.value && !isLocked && (
                          <Check size={20} color="#A78BFA" />
                        )}
                        {isLocked && (
                          <Crown size={20} color="#9E9EB0" />
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Paywall Lock Modal */}
      <PaywallLockModal
        visible={showPaywallModal}
        onClose={() => {
          setShowPaywallModal(false);
          setLockedFeatureName(undefined);
        }}
        featureName={lockedFeatureName}
      />
    </LinearGradient>
  );
};

export default SettingsScreen;
