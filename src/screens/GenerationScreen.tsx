import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import { X } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/appStore";
import { api } from "@/lib/api";
import type { GenerateSessionResponse } from "@/shared/contracts";

type Props = RootStackScreenProps<"Generation">;

const GenerationScreen = ({ navigation, route }: Props) => {
  const { goal, customPrompt } = route.params;
  const [status, setStatus] = useState<"generating" | "ready" | "error">("generating");
  const [session, setSession] = useState<GenerateSessionResponse | null>(null);
  const setCurrentSession = useAppStore((s) => s.setCurrentSession);
  const addSession = useAppStore((s) => s.addSession);
  const userName = useAppStore((s) => s.userName);

  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const generateSession = async () => {
    try {
      setStatus("generating");
      const response = await api.post<GenerateSessionResponse>("/api/sessions/generate", {
        goal,
        customPrompt
      });

      setSession(response);
      setCurrentSession(response);

      // Add to library
      console.log("[GenerationScreen] Adding session to library:", response.sessionId);
      addSession({
        id: response.sessionId,
        title: response.title,
        goal: response.goal,
        affirmations: response.affirmations,
        voiceId: response.voiceId,
        pace: response.pace,
        noise: response.noise,
        lengthSec: response.lengthSec,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        binauralCategory: response.binauralCategory,
        binauralHz: response.binauralHz,
      });
      console.log("[GenerationScreen] Session added to library");

      // Verify it was added
      setTimeout(() => {
        const currentSessions = useAppStore.getState().sessions;
        console.log("[GenerationScreen] Sessions in store after add:", currentSessions.length, "IDs:", currentSessions.map(s => s.id).slice(0, 3));
      }, 100);

      setStatus("ready");

      // Auto-navigate to playback after 1 second
      const timeoutId = setTimeout(() => {
        navigation.replace("Playback", { sessionId: response.sessionId });
      }, 1000);

      return timeoutId;
    } catch (error) {
      console.error("Failed to generate session:", error);
      setStatus("error");
      return null;
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const runGeneration = async () => {
      const result = await generateSession();
      if (isMounted && result) {
        timeoutId = result;
      }
    };

    runGeneration();

    // Cleanup timeout if component unmounts
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - goal and customPrompt come from route params

  const goalColors: Record<string, [string, string]> = {
    sleep: ["#2D1B69", "#8B7AB8"],
    focus: ["#FF9966", "#FF6B35"],
    calm: ["#44B09E", "#6BB6FF"],
    manifest: ["#9333EA", "#F59E0B"],
  };

  const goalTitles: Record<string, string> = {
    sleep: "Sleep",
    focus: "Focus",
    calm: "Calm",
    manifest: "Manifest",
  };

  const statusMessages = {
    generating: [
      "Crafting your affirmations...",
      "Mixing audio layers...",
      "Balancing frequencies...",
      "Almost ready...",
    ],
    ready: ["Your session is ready"],
    error: ["Something went wrong"],
  };

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (status === "generating") {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % statusMessages.generating.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <LinearGradient colors={goalColors[goal]} style={{ flex: 1 }}>
      <View className="flex-1 justify-center items-center px-8">
        <Pressable
          onPress={() => {
            // Check if we can go back, otherwise navigate to home
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.replace("Tabs", { screen: "HomeTab" });
            }
          }}
          className="absolute top-16 right-6 z-10"
        >
          <X size={32} color="#FFF" />
        </Pressable>

        <Animated.View
          entering={FadeIn.duration(600)}
          style={pulseStyle}
          className="items-center"
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              }}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(300).duration(600)} className="mt-12 items-center">
          <Text className="text-white text-4xl font-bold">{goalTitles[goal]}</Text>
          <Text className="text-white/80 text-lg mt-6 text-center">
            {status === "generating" && (
              <>
                {userName ? `Crafting your affirmations, ${userName}...` : statusMessages.generating[messageIndex]}
              </>
            )}
            {status === "ready" && statusMessages.ready[0]}
            {status === "error" && statusMessages.error[0]}
          </Text>
          {status === "generating" && (
            <Animated.View entering={FadeIn.delay(600).duration(400)}>
              <Text className="text-white/60 text-sm mt-3 text-center">
                Take a breath while you wait.
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        {status === "error" && (
          <Animated.View entering={FadeIn.delay(200)} className="mt-8">
            <Pressable
              onPress={generateSession}
              className="bg-white/20 px-8 py-4 rounded-2xl active:opacity-80"
            >
              <Text className="text-white text-lg font-semibold">Try Again</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );
};

export default GenerationScreen;
