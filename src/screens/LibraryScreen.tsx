import React, { useEffect, useState, useCallback, useRef } from "react";
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
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  const loadSessions = useCallback(async () => {
    try {
      const data = await api.get<GetSessionsResponse>("/api/sessions");

      // For guest users: merge API sessions (defaults) with any custom sessions already in the store
      // For authenticated users: API returns all sessions from DB, so just use those
      // 
      // Strategy:
      // 1. Get all temp sessions from current store that aren't in API response (preserve unsaved local sessions)
      // 2. Get all API sessions (defaults + saved custom sessions)
      // 3. Merge them, avoiding duplicates
      const apiSessionIds = new Set(data.sessions.map(s => s.id));
      const currentTempSessions = sessionsRef.current.filter(s => 
        s.id.startsWith("temp-") && !apiSessionIds.has(s.id)
      );
      
      // Create a map to avoid duplicates (prefer API version if both exist)
      const sessionMap = new Map<string, typeof data.sessions[0]>();
      
      // First, add all temp sessions (local, unsaved)
      currentTempSessions.forEach(session => {
        sessionMap.set(session.id, session);
      });
      
      // Then, add all API sessions (will overwrite temp sessions if they were saved)
      data.sessions.forEach(session => {
        sessionMap.set(session.id, session);
      });
      
      const mergedSessions = Array.from(sessionMap.values());
      
      // Sort by creation date (newest first)
      mergedSessions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setSessions(mergedSessions);
    } catch (error) {
      // Silently fail if user is not authenticated
      const errorMessage = error instanceof Error ? error.message : "";
      if (!errorMessage.includes("401")) {
        console.error("Failed to load sessions:", error);
      }
      // On error, preserve existing sessions (don't clear them)
      if (sessionsRef.current.length > 0) {
        console.log("[LibraryScreen] Preserving existing sessions due to API error");
      }
    } finally {
      setLoading(false);
    }
  }, [setSessions]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const toggleFavorite = async (sessionId: string, isFavorite: boolean) => {
    setTogglingFavoriteId(sessionId);
    
    try {
      // For guest sessions (temp-*) or default sessions (default-*), just update locally
      if (sessionId.startsWith("temp-") || sessionId.startsWith("default-")) {
        updateSession(sessionId, { isFavorite: !isFavorite });
        return;
      }

      // For authenticated users with saved sessions, update in backend
      await api.patch(`/api/sessions/${sessionId}/favorite`, { isFavorite: !isFavorite });
      updateSession(sessionId, { isFavorite: !isFavorite });
    } catch (error) {
      // Silently fail if user is not authenticated (401)
      const errorMessage = error instanceof Error ? error.message : "";
      if (!errorMessage.includes("401")) {
        console.error("Failed to toggle favorite:", error);
      }
    } finally {
      setTogglingFavoriteId(null);
    }
  };

  const deleteSession = async (sessionId: string) => {
    setDeletingSessionId(sessionId);
    
    try {
      // For guest users (temp sessions), just remove locally without API call
      if (sessionId.startsWith("temp-")) {
        removeSession(sessionId);
        return;
      }

      // For authenticated users, delete from backend
      await api.delete(`/api/sessions/${sessionId}`);
      removeSession(sessionId);
    } catch (error) {
      // Silently fail if user is not authenticated (401)
      const errorMessage = error instanceof Error ? error.message : "";
      if (!errorMessage.includes("401")) {
        console.error("Failed to delete session:", error);
      }
    } finally {
      setDeletingSessionId(null);
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

        {/* Filter Pills - Sticky */}
        {sessions.length > 0 && (
          <Animated.View entering={FadeIn.delay(200).duration(500)} className="mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 24 }}
              stickyHeaderIndices={[0]}
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
                colors={["#44B09E", "#2A7A6E"]}
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
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 pr-4">
                      <Text className="text-white text-lg font-bold" numberOfLines={1}>
                        {session.title}
                      </Text>
                      <View className="flex-row items-center mt-1.5">
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
                  <View className="mb-2">
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
                    <View className="flex-row gap-5 items-center">
                      {!session.id.startsWith("default-") && (
                        <>
                          <Pressable onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate("CreateSession", { sessionId: session.id });
                          }}>
                            <Pencil size={24} color="#FFF" strokeWidth={2} />
                          </Pressable>
                          <Pressable 
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleFavorite(session.id, session.isFavorite);
                            }}
                            disabled={togglingFavoriteId === session.id}
                          >
                            <Heart
                              size={24}
                              color="#FFF"
                              fill={session.isFavorite ? "#FFF" : "transparent"}
                              strokeWidth={2}
                              opacity={togglingFavoriteId === session.id ? 0.5 : 1}
                            />
                          </Pressable>
                          <Pressable 
                            onPress={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                            disabled={deletingSessionId === session.id}
                          >
                            <Trash2 
                              size={24} 
                              color="#FFF" 
                              strokeWidth={2}
                              opacity={deletingSessionId === session.id ? 0.5 : 1}
                            />
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
