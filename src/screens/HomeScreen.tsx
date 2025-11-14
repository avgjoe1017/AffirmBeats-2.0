import React, { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Moon, Zap, Heart, Play, Sparkles, Plus } from "lucide-react-native";
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { BottomTabScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/appStore";
import { api } from "@/lib/api";
import type { GetPreferencesResponse, GetSessionsResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"HomeTab">;

const HomeScreen = ({ navigation }: Props) => {
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const sessions = useAppStore((s) => s.sessions);
  const setSessions = useAppStore((s) => s.setSessions);
  const userName = useAppStore((s) => s.userName);
  const [greeting, setGreeting] = useState("");
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const hasLoadedRef = useRef(false);

  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.75;

  useEffect(() => {
    // Only load once on mount to prevent infinite loops
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Load preferences
    api
      .get<GetPreferencesResponse>("/api/preferences")
      .then((prefs) => {
        setPreferences({ 
          ...prefs, 
          duration: preferences.duration, 
          affirmationSpacing: preferences.affirmationSpacing 
        });
      })
      .catch((error) => {
        // Silently fail if user is not authenticated
        // They can still use the app with default preferences
        if (!error.message?.includes("401")) {
          console.error("Failed to load preferences:", error);
        }
      });

    // Load recent sessions
    api
      .get<GetSessionsResponse>("/api/sessions")
      .then((data) => {
        // For guest users: merge API sessions (defaults) with any custom sessions already in the store
        // For authenticated users: API returns all sessions from DB, so just use those
        // Filter out temp sessions that were successfully saved to server (they'll be in data.sessions)
        const tempSessionIds = new Set(data.sessions.map(s => s.id));
        const existingCustomSessions = sessionsRef.current.filter(s => 
          s.id.startsWith("temp-") && !tempSessionIds.has(s.id)
        );
        const mergedSessions = [...existingCustomSessions, ...data.sessions];
        setSessions(mergedSessions);
      })
      .catch((error) => {
        // Silently fail if user is not authenticated
        const errorMessage = error instanceof Error ? error.message : "";
        if (!errorMessage.includes("401")) {
          console.error("Failed to load sessions:", error);
        }
      });

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const goals = [
    { id: "sleep", label: "Sleep", subtitle: "Rest deeply", icon: Moon, colors: ["#2D1B69", "#8B7AB8"], theme: "Rest & Recovery" },
    { id: "focus", label: "Focus", subtitle: "Sharp mind", icon: Zap, colors: ["#FF9966", "#FF6B35"], theme: "Deep Work" },
    { id: "calm", label: "Calm", subtitle: "Find peace", icon: Heart, colors: ["#44B09E", "#6BB6FF"], theme: "Peace & Presence" },
    { id: "manifest", label: "Manifest", subtitle: "Create reality", icon: Sparkles, colors: ["#9333EA", "#F59E0B"], theme: "Abundance & Goals" },
  ];

  const goalColors: Record<string, [string, string]> = {
    sleep: ["#2D1B69", "#8B7AB8"],
    focus: ["#FF9966", "#FF6B35"],
    calm: ["#44B09E", "#6BB6FF"],
    manifest: ["#9333EA", "#F59E0B"],
  };

  // Get recent sessions (up to 3 most recent)
  const recentSessions = sessions.slice(0, 3);

  return (
    <LinearGradient colors={["#0F0F1E", "#1A1A2E"]} style={{ flex: 1 }}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(600)} className="mt-8 mb-8">
          <Text className="text-gray-400 text-lg">
            {greeting}{userName ? `, ${userName}` : ""}
          </Text>
          <Text className="text-white text-3xl font-bold mt-2">
            What do you need?
          </Text>
        </Animated.View>

        {/* Jump Back In Section */}
        {recentSessions.length > 0 && (
          <Animated.View entering={FadeIn.delay(200).duration(500)} className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Jump Back In</Text>
              <Pressable
                onPress={() => navigation.navigate("LibraryTab")}
                className="active:opacity-70"
              >
                <Text className="text-gray-400 text-sm">View All</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 24 }}
            >
              {recentSessions.map((session, index) => (
                <Pressable
                  key={session.id}
                  onPress={() => navigation.navigate("Playback", { sessionId: session.id })}
                  className="active:opacity-80 mr-4"
                  style={{ width: cardWidth }}
                >
                  <LinearGradient
                    colors={goalColors[session.goal] || ["#333", "#555"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 20,
                      padding: 20,
                      height: 140,
                      justifyContent: "space-between",
                    }}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-4">
                        <Text className="text-white text-lg font-bold" numberOfLines={1}>
                          {session.title}
                        </Text>
                        <Text className="text-white/70 text-sm mt-1">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </Text>
                        {session.binauralCategory && session.binauralHz && (
                          <Text className="text-white/60 text-xs mt-1 capitalize">
                            {session.binauralCategory} • {session.binauralHz} Hz
                          </Text>
                        )}
                      </View>
                      <View className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-semibold uppercase">
                          {session.goal}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-white/70 text-sm">
                        {Math.floor(session.lengthSec / 60)}:{(session.lengthSec % 60).toString().padStart(2, '0')}
                      </Text>
                      <View className="bg-white rounded-full p-3">
                        <Play size={24} color="#1A1A2E" fill="#1A1A2E" />
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Create Session Button - Elevated */}
        <Animated.View entering={FadeIn.delay(recentSessions.length > 0 ? 350 : 200).duration(500)} className="mb-8">
          <Pressable
            onPress={() => navigation.navigate("CreateSession", {})}
            className="active:opacity-80"
          >
            <LinearGradient
              colors={["#8B7AB8", "#6B5A98"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 20,
                padding: 22,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#8B7AB8",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Plus size={26} color="#FFF" strokeWidth={2.5} />
              <Text className="text-white text-xl font-bold ml-2">
                Create Custom Session
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Choose Your Focus Section */}
        <Animated.View entering={FadeIn.delay(recentSessions.length > 0 ? 400 : 200).duration(500)} className="mb-6">
          <Text className="text-gray-400 text-xs uppercase tracking-wider">
            Choose Your Focus
          </Text>
        </Animated.View>

        {goals.map((goal, index) => {
          const Icon = goal.icon;
          return (
            <Animated.View
              key={goal.id}
              entering={FadeIn.delay(300 + (recentSessions.length > 0 ? 400 : 200) + index * 100).duration(500)}
              className="mb-4"
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Generation", { goal: goal.id as "sleep" | "focus" | "calm" | "manifest" });
                }}
                className="active:opacity-80"
              >
                <LinearGradient
                  colors={goal.colors as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 24,
                    padding: 24,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-white/10 rounded-2xl p-3">
                      <Icon size={32} color="#FFF" strokeWidth={2} />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-white text-2xl font-bold">{goal.label}</Text>
                      <View className="flex-row items-center mt-1 gap-2">
                        <Text className="text-white/70 text-sm">{goal.subtitle}</Text>
                        <Text className="text-white/50 text-xs">•</Text>
                        <Text className="text-white/60 text-xs uppercase tracking-wider">{goal.theme}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="ml-4">
                    <Play size={24} color="#FFF" fill="#FFF" />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}

        <View className="h-32" />
      </ScrollView>
    </LinearGradient>
  );
};

export default HomeScreen;
