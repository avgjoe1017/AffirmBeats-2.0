import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Sparkles, Moon, Zap, Heart, Check } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/appStore";

type Props = RootStackScreenProps<"Onboarding">;

const OnboardingScreen = ({ navigation }: Props) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 3 steps: name -> goal -> intention
  const [name, setName] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<"sleep" | "focus" | "calm" | "manifest" | null>(null);
  const [userIntention, setUserIntention] = useState(""); // What user wants to accomplish
  const setHasCompletedOnboarding = useAppStore((s) => s.setHasCompletedOnboarding);
  const setUserName = useAppStore((s) => s.setUserName);

  const goals = [
    { id: "sleep", label: "Sleep", icon: Moon, colors: ["#2D1B69", "#8B7AB8"] },
    { id: "focus", label: "Focus", icon: Zap, colors: ["#FF9966", "#FF6B35"] },
    { id: "calm", label: "Calm", icon: Heart, colors: ["#44B09E", "#6BB6FF"] },
    { id: "manifest", label: "Manifest", icon: Sparkles, colors: ["#9333EA", "#F59E0B"] },
  ];

  const handleGoalSelect = (goal: "sleep" | "focus" | "calm" | "manifest") => {
    setSelectedGoal(goal);
  };

  const handleContinue = () => {
    if (step === 1 && isNameValid) {
      setUserName(name.trim());
      setStep(2);
    } else if (step === 2 && selectedGoal !== null) {
      setStep(3);
    } else if (step === 3 && userIntention.trim().length > 0) {
      // Navigate to AI generation with the intention
      setHasCompletedOnboarding(true);
      navigation.replace("Generation", {
        goal: selectedGoal!,
        customPrompt: userIntention.trim()
      });
    }
  };

  const handleSkip = () => {
    setHasCompletedOnboarding(true);
    navigation.replace("Tabs");
  };

  const isNameValid = name.trim().length > 0 && name.trim().length <= 20;
  const canContinue =
    (step === 1 && isNameValid) ||
    (step === 2 && selectedGoal !== null) ||
    (step === 3 && userIntention.trim().length > 0);

  return (
    <LinearGradient colors={["#0F0F1E", "#1A1A2E", "#0F0F1E"]} style={{ flex: 1 }}>
      {/* Skip button */}
      <View className="absolute top-14 right-6 z-10">
        <Pressable onPress={handleSkip} className="active:opacity-60">
          <Text className="text-gray-400 text-base">Skip for now</Text>
        </Pressable>
      </View>

      <View className="flex-1 justify-center px-8 pb-20">
        <Animated.View entering={FadeIn.duration(800)} className="items-center mb-12">
          <Sparkles size={48} color="#8B7AB8" strokeWidth={1.5} />
          <Text className="text-white text-4xl font-bold mt-6 text-center">
            Affirmation Beats
          </Text>
          <Text className="text-gray-400 text-lg mt-3 text-center">
            Hear what you need to believe
          </Text>
        </Animated.View>

        {/* Step 1: Name Input */}
        {step === 1 && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mb-8">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-semibold">What should we call you?</Text>
              <View className="bg-white/10 px-2 py-1 rounded-full">
                <Text className="text-gray-400 text-xs">1 of 3</Text>
              </View>
            </View>
            <View className="relative">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="First name or nickname"
                placeholderTextColor="#666"
                className="bg-white/10 text-white px-4 py-4 rounded-2xl text-lg"
                autoCapitalize="words"
                autoFocus
                maxLength={20}
              />
              {isNameValid && (
                <View className="absolute right-4 top-4">
                  <Check size={24} color="#44B09E" strokeWidth={2.5} />
                </View>
              )}
            </View>
            <Text className="text-gray-500 text-sm mt-2">
              {name.length}/20 characters
            </Text>
          </Animated.View>
        )}

        {/* Step 2: Goal Selection */}
        {step === 2 && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-semibold">What&apos;s your focus?</Text>
              <View className="bg-white/10 px-2 py-1 rounded-full">
                <Text className="text-gray-400 text-xs">2 of 3</Text>
              </View>
            </View>
            <Text className="text-gray-400 text-sm mb-4">
              Choose the area you&apos;d like to work on
            </Text>
            {goals.map((goal, index) => {
              const Icon = goal.icon;
              const isSelected = selectedGoal === goal.id;
              return (
                <Animated.View
                  key={goal.id}
                  entering={FadeInDown.delay(400 + index * 100).duration(500)}
                  className="mb-3"
                >
                  <Pressable
                    onPress={() => handleGoalSelect(goal.id as "sleep" | "focus" | "calm" | "manifest")}
                    className="active:opacity-80"
                  >
                    <LinearGradient
                      colors={goal.colors as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 16,
                        padding: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: isSelected ? "#FFF" : "transparent",
                      }}
                    >
                      <Icon size={28} color="#FFF" strokeWidth={2} />
                      <Text className="text-white text-xl font-semibold ml-4 flex-1">
                        {goal.label}
                      </Text>
                      {isSelected && (
                        <View className="bg-white rounded-full p-1">
                          <Check size={20} color={goal.colors[0]} strokeWidth={3} />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* Step 3: User Intention Input */}
        {step === 3 && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mb-8">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-semibold">What do you want to work on?</Text>
              <View className="bg-white/10 px-2 py-1 rounded-full">
                <Text className="text-gray-400 text-xs">3 of 3</Text>
              </View>
            </View>
            <Text className="text-gray-400 text-sm mb-4">
              Describe your goal and we&apos;ll create personalized AI affirmations for you
            </Text>
            <View className="relative">
              <TextInput
                value={userIntention}
                onChangeText={setUserIntention}
                placeholder="e.g., I want to feel confident and empowered at work"
                placeholderTextColor="#666"
                className="bg-white/10 text-white px-4 py-4 rounded-2xl text-lg"
                multiline
                numberOfLines={4}
                autoFocus
                maxLength={200}
                style={{ minHeight: 100, textAlignVertical: "top" }}
              />
            </View>
            <Text className="text-gray-500 text-sm mt-2">
              {userIntention.length}/200 characters
            </Text>
            <View className="bg-purple-500/20 rounded-2xl p-4 mt-4 border border-purple-500/30">
              <View className="flex-row items-start">
                <Sparkles size={20} color="#8B7AB8" strokeWidth={2} />
                <Text className="text-purple-200 text-sm ml-3 flex-1">
                  Our AI will generate 6-10 personalized affirmations based on your goal
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Continue Button */}
      <View className="absolute bottom-0 left-0 right-0 px-8 pb-10">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          className={`active:opacity-80 ${!canContinue ? "opacity-40" : ""}`}
        >
          <LinearGradient
            colors={canContinue ? ["#8B7AB8", "#6B5A98"] : ["#4A4A5A", "#3A3A4A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 100,
              paddingVertical: 18,
              paddingHorizontal: 32,
              alignItems: "center",
            }}
          >
            <Text className="text-white text-lg font-bold">
              {step === 3 ? "Create My First Session" : "Continue"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

export default OnboardingScreen;
