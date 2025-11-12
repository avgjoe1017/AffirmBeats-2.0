import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Trash2, Play, Pencil } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { BottomTabScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/appStore";
import { api } from "@/lib/api";
import type { GetSessionsResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"LibraryTab">;

type FilterType = "all" | "sleep" | "focus" | "calm" | "manifest";

const LibraryScreen = ({ navigation }: Props) => {
  const sessions = useAppStore((s) => s.sessions);
  const setSessions = useAppStore((s) => s.setSessions);
  const updateSession = useAppStore((s) => s.updateSession);
  const removeSession = useAppStore((s) => s.removeSession);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.get<GetSessionsResponse>("/api/sessions");

      // For guest users: merge API sessions (defaults) with any custom sessions already in the store
      // For authenticated users: API returns all sessions from DB, so just use those
      // Filter out temp sessions that were successfully saved to server (they'll be in data.sessions)
      const tempSessionIds = new Set(data.sessions.map(s => s.id));
      const existingCustomSessions = sessions.filter(s => 
        s.id.startsWith("temp-") && !tempSessionIds.has(s.id)
      );
      const mergedSessions = [...existingCustomSessions, ...data.sessions];

      setSessions(mergedSessions);
    } catch (error) {
      // Silently fail if user is not authenticated
      const errorMessage = error instanceof Error ? error.message : "";
      if (!errorMessage.includes("401")) {
        console.error("Failed to load sessions:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (sessionId: string, isFavorite: boolean) => {
    // For guest sessions (temp-*) or default sessions (default-*), just update locally
    if (sessionId.startsWith("temp-") || sessionId.startsWith("default-")) {
      updateSession(sessionId, { isFavorite: !isFavorite });
      return;
    }

    // For authenticated users with saved sessions, update in backend
    try {
      await api.patch(`/api/sessions/${sessionId}/favorite`, { isFavorite: !isFavorite });
      updateSession(sessionId, { isFavorite: !isFavorite });
    } catch (error) {
      // Silently fail if user is not authenticated (401)
      const errorMessage = error instanceof Error ? error.message : "";
      if (!errorMessage.includes("401")) {
        console.error("Failed to toggle favorite:", error);
      }
    }
  };

  const deleteSession = async (sessionId: string) => {
    // For guest users (temp sessions), just remove locally without API call
    if (sessionId.startsWith("temp-")) {
      removeSession(sessionId);
      return;
    }

    // For authenticated users, delete from backend
    try {
      await api.delete(`/api/sessions/${sessionId}`);
      removeSession(sessionId);
    } catch (error) {
      // Silently fail if user is not authenticated (401)
      const errorMessage = error instanceof Error ? error.message : "";
      if (!errorMessage.includes("401")) {
        console.error("Failed to delete session:", error);
      }
    }
  };

  const goalColors: Record<string, [string, string]> = {
    sleep: ["#2D1B69", "#8B7AB8"],
    focus: ["#FF9966", "#FF6B35"],
    calm: ["#44B09E", "#6BB6FF"],
    manifest: ["#9333EA", "#F59E0B"],
  };

  const goalThemes: Record<string, string> = {
    sleep: "Rest & Recovery",
    focus: "Deep Work",
    calm: "Peace & Presence",
    manifest: "Abundance & Goals",
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "sleep", label: "Sleep" },
    { id: "focus", label: "Focus" },
    { id: "calm", label: "Calm" },
    { id: "manifest", label: "Manifest" },
  ];

  // Filter sessions based on active filter
  const filteredSessions = activeFilter === "all"
    ? sessions
    : sessions.filter((s) => s.goal === activeFilter);

  return (
    <LinearGradient colors={["#0F0F1E", "#1A1A2E"]} style={{ flex: 1 }}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(600)} className="mt-8 mb-6">
          <Text className="text-white text-3xl font-bold">Your Library</Text>
          <Text className="text-gray-400 text-base mt-2">
            {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
          </Text>
        </Animated.View>

        {/* Filter Pills */}
        {sessions.length > 0 && (
          <Animated.View entering={FadeIn.delay(200).duration(500)} className="mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 24 }}
            >
              {filters.map((filter, index) => (
                <Pressable
                  key={filter.id}
                  onPress={() => setActiveFilter(filter.id)}
                  className="mr-3"
                >
                  <View
                    className={`px-5 py-2 rounded-full ${
                      activeFilter === filter.id
                        ? "bg-white"
                        : "bg-white/10"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        activeFilter === filter.id
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {loading ? (
          <Text className="text-gray-400 text-center mt-12">Loading...</Text>
        ) : sessions.length === 0 ? (
          <View className="items-center mt-20">
            <Text className="text-gray-400 text-center text-lg mb-6">
              No sessions yet.{"\n"}Create your first one!
            </Text>
            <Pressable
              onPress={() => navigation.navigate("HomeTab")}
              className="active:opacity-80"
            >
              <LinearGradient
                colors={["#8B7AB8", "#6B5A98"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 100,
                  paddingVertical: 16,
                  paddingHorizontal: 32,
                  alignItems: "center",
                }}
              >
                <Text className="text-white text-base font-bold">
                  Generate Your First Session
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View className="items-center mt-20">
            <Text className="text-gray-400 text-center text-lg">
              No {activeFilter} sessions yet.
            </Text>
          </View>
        ) : (
          filteredSessions.map((session, index) => (
            <Animated.View
              key={session.id}
              entering={FadeIn.delay(index * 50).duration(400)}
              className="mb-4"
            >
              <Pressable
                onPress={() => navigation.navigate("Playback", { sessionId: session.id })}
                className="active:opacity-80"
              >
                <LinearGradient
                  colors={goalColors[session.goal] || ["#333", "#555"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 20,
                    padding: 20,
                  }}
                >
                  {/* Header Row */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 pr-4">
                      <Text className="text-white text-lg font-bold" numberOfLines={1}>
                        {session.title}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-white/70 text-sm">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </Text>
                        <Text className="text-white/50 text-sm mx-2">•</Text>
                        <Text className="text-white/70 text-sm">
                          {Math.floor(session.lengthSec / 60)}:{(session.lengthSec % 60).toString().padStart(2, '0')}
                        </Text>
                        {session.binauralCategory && session.binauralHz && (
                          <>
                            <Text className="text-white/50 text-sm mx-2">•</Text>
                            <Text className="text-white/70 text-sm capitalize">
                              {session.binauralCategory} ({session.binauralHz} Hz)
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-semibold uppercase">
                        {session.goal}
                      </Text>
                    </View>
                  </View>

                  {/* Theme Label */}
                  <View className="mb-3">
                    <Text className="text-white/90 text-sm font-medium">
                      {goalThemes[session.goal] || "Affirmation Session"}
                    </Text>
                  </View>

                  {/* Action Row */}
                  <View className="flex-row items-center justify-between pt-2 border-t border-white/10">
                    <View className="flex-row items-center gap-2">
                      <Play size={18} color="#FFF" fill="#FFF" />
                      <Text className="text-white/70 text-xs">
                        {session.affirmations?.length || 0} affirmations
                      </Text>
                    </View>
                    <View className="flex-row gap-4 items-center">
                      {!session.id.startsWith("default-") && (
                        <>
                          <Pressable onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate("CreateSession", { sessionId: session.id });
                          }}>
                            <Pencil size={20} color="#FFF" />
                          </Pressable>
                          <Pressable onPress={(e) => {
                            e.stopPropagation();
                            toggleFavorite(session.id, session.isFavorite);
                          }}>
                            <Heart
                              size={20}
                              color="#FFF"
                              fill={session.isFavorite ? "#FFF" : "transparent"}
                            />
                          </Pressable>
                          <Pressable onPress={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}>
                            <Trash2 size={20} color="#FFF" />
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))
        )}

        <View className="h-32" />
      </ScrollView>
    </LinearGradient>
  );
};

export default LibraryScreen;
