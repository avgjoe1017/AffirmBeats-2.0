import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, AppState, AppStateStatus, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Play, Pause, Heart, RotateCcw, Shuffle, ChevronDown, Settings } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { setAudioModeAsync } from "expo-audio";
import type { RootStackScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/appStore";
import type { GetSessionsResponse } from "@/shared/contracts";
import { api } from "@/lib/api";
import AudioMixerModal from "@/components/AudioMixerModal";

type Props = RootStackScreenProps<"Playback">;
type Session = GetSessionsResponse["sessions"][0];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VISUALIZATION_SIZE = Math.min(SCREEN_WIDTH - 96, 280);

// Floating Particle Component - Like dust particles in light
const FloatingParticle = ({ index, isPlaying }: { index: number; isPlaying: boolean }) => {
  const floatX = useSharedValue(0);
  const floatY = useSharedValue(0);
  const fadeAnim = useSharedValue(0);

  // Random starting positions and movement patterns for organic feel
  const startX = (index * 37) % VISUALIZATION_SIZE;
  const startY = (index * 53) % VISUALIZATION_SIZE;
  const movePattern = (index % 3) + 1;

  useEffect(() => {
    if (isPlaying) {
      // Each particle has its own unique, slow float pattern with pauses
      floatX.value = withRepeat(
        withTiming(movePattern * 40, {
          duration: 8000 + (index % 5) * 2000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) // Ease in and out with pause effect
        }),
        -1,
        true
      );

      floatY.value = withRepeat(
        withTiming(movePattern * -30, {
          duration: 10000 + (index % 7) * 1500,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) // Ease in and out with pause effect
        }),
        -1,
        true
      );

      fadeAnim.value = withRepeat(
        withTiming(1, {
          duration: 5000 + (index % 4) * 1000,
          easing: Easing.bezier(0.4, 0.0, 0.6, 1.0)
        }),
        -1,
        true
      );
    } else {
      floatX.value = 0;
      floatY.value = 0;
      fadeAnim.value = 0;
    }
  }, [isPlaying, index]);

  const particleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fadeAnim.value, [0, 0.5, 1], [0.1, 0.4, 0.1]),
    transform: [
      { translateX: floatX.value },
      { translateY: floatY.value },
    ],
  }));

  const size = 3 + (index % 4);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#FFFFFF",
        },
        particleStyle,
      ]}
    />
  );
};

// Breathing Circle Component - Central focus point
const BreathingCircle = ({ isPlaying, color }: { isPlaying: boolean; color: string }) => {
  const breathe = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      // Very deep, slow breathing with long pause at expansion - 10 seconds total
      breathe.value = withRepeat(
        withTiming(1, { duration: 10000, easing: Easing.bezier(0.22, 0.61, 0.36, 1) }), // Slower, smoother with pause at peak
        -1,
        true
      );

      // Very slow rotation for gentle movement
      rotate.value = withRepeat(
        withTiming(360, { duration: 60000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [isPlaying]);

  const circleStyle = useAnimatedStyle(() => ({
    // Slower fade with pause at peak
    opacity: interpolate(breathe.value, [0, 0.4, 0.5, 0.6, 1], [0.3, 0.55, 0.6, 0.55, 0.3]),
    transform: [
      // Slow expansion, pause at peak, then slow contraction
      { scale: interpolate(breathe.value, [0, 0.4, 0.5, 0.6, 1], [0.6, 0.95, 1, 0.95, 0.6]) },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <View style={{ position: "absolute", width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
      {/* Outer ring */}
      <Animated.View
        style={[
          {
            width: VISUALIZATION_SIZE * 0.7,
            height: VISUALIZATION_SIZE * 0.7,
            borderRadius: VISUALIZATION_SIZE,
            borderWidth: 1,
            borderColor: color,
          },
          circleStyle,
        ]}
      />

      {/* Middle ring */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: VISUALIZATION_SIZE * 0.5,
            height: VISUALIZATION_SIZE * 0.5,
            borderRadius: VISUALIZATION_SIZE,
            borderWidth: 1.5,
            borderColor: "#FFFFFF",
          },
          circleStyle,
        ]}
      />

      {/* Inner glow */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: VISUALIZATION_SIZE * 0.3,
            height: VISUALIZATION_SIZE * 0.3,
            borderRadius: VISUALIZATION_SIZE,
            backgroundColor: "#FFFFFF",
          },
          circleStyle,
        ]}
      />
    </View>
  );
};

// Main Organic Visualization - Particle field with breathing center
const OrganicWaveVisualizer = ({ progress, isPlaying, colors }: { progress: number; isPlaying: boolean; colors: [string, string] }) => {
  // Create 25 particles for organic, floating effect
  const particles = Array.from({ length: 25 }, (_, i) => i);

  return (
    <View style={{ width: VISUALIZATION_SIZE, height: VISUALIZATION_SIZE }}>
      {/* Background ambient glow that pulses with progress */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor: colors[1],
          opacity: 0.05 + (progress / 100) * 0.1,
          borderRadius: VISUALIZATION_SIZE / 2,
        }}
      />

      {/* Floating particles - like dust in light */}
      {particles.map((i) => (
        <FloatingParticle key={i} index={i} isPlaying={isPlaying} />
      ))}

      {/* Central breathing circle */}
      <BreathingCircle isPlaying={isPlaying} color={colors[1]} />

      {/* Progress indicator - subtle ring that fills */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <View
          style={{
            width: VISUALIZATION_SIZE * 0.85,
            height: VISUALIZATION_SIZE * 0.85,
            borderRadius: VISUALIZATION_SIZE,
            borderWidth: 2,
            borderColor: "#FFFFFF",
            opacity: 0.1,
          }}
        />
      </View>
    </View>
  );
};

const PlaybackScreen = ({ navigation, route }: Props) => {
  const { sessionId } = route.params;
  const sessions = useAppStore((s) => s.sessions);
  const currentSession = useAppStore((s) => s.currentSession);
  const setCurrentSession = useAppStore((s) => s.setCurrentSession);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);
  const currentTime = useAppStore((s) => s.currentTime);
  const setCurrentTime = useAppStore((s) => s.setCurrentTime);
  const updateSession = useAppStore((s) => s.updateSession);
  const addSession = useAppStore((s) => s.addSession);

  const [showTranscript, setShowTranscript] = useState(false);
  const [showAudioMixer, setShowAudioMixer] = useState(false);

  // Find session from library or use current session
  const session = sessions.find((s) => s.id === sessionId) ||
    (currentSession?.sessionId === sessionId ? {
      id: currentSession.sessionId,
      title: currentSession.title,
      goal: currentSession.goal,
      affirmations: currentSession.affirmations,
      lengthSec: currentSession.lengthSec,
      voiceId: currentSession.voiceId,
      pace: currentSession.pace,
      noise: currentSession.noise,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    } : null);

  // Set this session as the current session for MiniPlayer to work
  useEffect(() => {
    if (session && (!currentSession || currentSession.sessionId !== session.id)) {
      console.log("[PlaybackScreen] Setting current session for MiniPlayer:", session.id);
      setCurrentSession({
        sessionId: session.id,
        title: session.title,
        goal: session.goal,
        affirmations: session.affirmations,
        lengthSec: session.lengthSec,
        voiceId: session.voiceId,
        pace: session.pace,
        noise: session.noise,
        binauralCategory: session.binauralCategory,
        binauralHz: session.binauralHz,
      });
    }
  }, [session?.id]);

  const foundInSessions = !!sessions.find((s) => s.id === sessionId);
  const foundInCurrentSession = currentSession?.sessionId === sessionId;
  console.log("[PlaybackScreen] Session lookup:", {
    sessionId,
    found: !!session,
    goal: session?.goal,
    foundInSessions,
    foundInCurrentSession,
    totalSessions: sessions.length
  });

  // Set up audio mode for background playback
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'duckOthers',
          interruptionModeAndroid: 'duckOthers',
        });
        console.log("[Playback] Audio mode configured for background playback");
      } catch (error) {
        console.error("[Playback] Failed to set audio mode:", error);
      }
    };

    setupAudio();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      console.log("[Playback] App state changed to:", nextAppState);
      // Audio continues playing in background automatically
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Simulate playback progress
  useEffect(() => {
    if (!isPlaying || !session) return;

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => {
        const newTime = prevTime + 1;
        if (newTime >= session.lengthSec) {
          setIsPlaying(false);
          return session.lengthSec;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, session]); // Removed currentTime from dependencies to prevent interval restart

  if (!session) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">Session not found</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-purple-400 text-base">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const goalColors: Record<string, [string, string]> = {
    sleep: ["#2D1B69", "#8B7AB8"],
    focus: ["#FF9966", "#FF6B35"],
    calm: ["#44B09E", "#6BB6FF"],
    manifest: ["#9333EA", "#F59E0B"],
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual audio playback with ElevenLabs
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleRegenerate = () => {
    // Navigate back to generation screen with same goal
    navigation.navigate("Generation", { goal: session.goal as any });
  };

  const handleGoBack = () => {
    // Always navigate to Tabs (Home) instead of going back
    // This prevents going back to CreateSession or Generation screens
    navigation.navigate("Tabs", { screen: "HomeTab" });
  };

  const toggleFavorite = async () => {
    if (!session) return;

    console.log("[PlaybackScreen] toggleFavorite called for session:", session.id);

    // Check if session exists in the sessions array
    const sessionInLibrary = sessions.find((s) => s.id === session.id);
    console.log("[PlaybackScreen] Session in library:", !!sessionInLibrary, "isFavorite:", sessionInLibrary?.isFavorite);

    if (sessionInLibrary) {
      // Update existing session in library
      const newFavoriteState = !sessionInLibrary.isFavorite;
      console.log("[PlaybackScreen] Updating existing session favorite to:", newFavoriteState);

      // Update local state first for immediate UI feedback
      updateSession(session.id, { isFavorite: newFavoriteState });

      // Try to update on backend (will fail silently for guest users with temp IDs)
      try {
        if (!session.id.startsWith('temp-')) {
          await api.patch(`/api/sessions/${session.id}/favorite`, { isFavorite: newFavoriteState });
        }
      } catch (error) {
        console.log("[PlaybackScreen] Could not update favorite on backend (guest user):", error);
      }
    } else if (currentSession?.sessionId === session.id) {
      // Session is not in library yet, add it first
      console.log("[PlaybackScreen] Adding session to library with favorite=true");
      const newSession: Session = {
        id: currentSession.sessionId,
        title: currentSession.title,
        goal: currentSession.goal,
        affirmations: currentSession.affirmations,
        lengthSec: currentSession.lengthSec,
        voiceId: currentSession.voiceId,
        pace: currentSession.pace,
        noise: currentSession.noise,
        isFavorite: true, // Set to true immediately
        createdAt: new Date().toISOString(),
        binauralCategory: currentSession.binauralCategory,
        binauralHz: currentSession.binauralHz,
      };
      addSession(newSession);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if session is favorited - use the session from library if it exists
  const sessionInLibrary = sessions.find((s) => s.id === sessionId);
  const isFavorited = sessionInLibrary?.isFavorite ?? false;

  console.log("[PlaybackScreen] Render - isFavorited:", isFavorited, "sessionInLibrary:", !!sessionInLibrary);

  const progress = session ? (currentTime / session.lengthSec) * 100 : 0;

  return (
    <LinearGradient colors={goalColors[session.goal]} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={handleGoBack} className="active:opacity-70">
              <ChevronDown size={28} color="#FFF" />
            </Pressable>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => setShowAudioMixer(true)} className="active:opacity-70">
                <Settings size={28} color="#FFF" />
              </Pressable>
              <Pressable onPress={toggleFavorite} className="active:opacity-70">
                <Heart
                  size={28}
                  color="#FFF"
                  fill={isFavorited ? "#FFF" : "transparent"}
                />
              </Pressable>
            </View>
          </View>

          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Organic Wave Visualization Area */}
            <Animated.View entering={FadeIn.duration(600)} className="items-center my-8">
              <Text className="text-white/90 text-2xl font-bold text-center mb-2">
                {session.title}
              </Text>
              <Text className="text-white/60 text-sm uppercase tracking-wider">
                {session.goal} • {session.pace} pace
              </Text>

              {/* Organic Flowing Wave Visualization */}
              <View className="w-full mt-12 mb-8 items-center">
                <OrganicWaveVisualizer
                  progress={progress}
                  isPlaying={isPlaying}
                  colors={goalColors[session.goal]}
                />
              </View>

              {/* Progress Bar */}
              <View className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <View
                  className="h-full bg-white rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>

              {/* Time Display */}
              <View className="flex-row justify-between w-full mt-2 px-1">
                <Text className="text-white/70 text-sm">{formatTime(currentTime)}</Text>
                <Text className="text-white/70 text-sm">{formatTime(session.lengthSec)}</Text>
              </View>
            </Animated.View>

            {/* Playback Controls */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} className="items-center mb-8">
              <View className="flex-row items-center justify-center space-x-8">
                {/* Restart Button */}
                <Pressable onPress={handleRestart} className="active:opacity-70">
                  <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
                    <RotateCcw size={24} color="#FFF" />
                  </View>
                </Pressable>

                {/* Play/Pause Button */}
                <Pressable onPress={togglePlay} className="active:scale-95">
                  <View className="w-20 h-20 rounded-full bg-white items-center justify-center shadow-lg">
                    {isPlaying ? (
                      <Pause size={36} color={goalColors[session.goal][0]} fill={goalColors[session.goal][0]} />
                    ) : (
                      <Play size={36} color={goalColors[session.goal][0]} fill={goalColors[session.goal][0]} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                </Pressable>

                {/* Regenerate Button */}
                <Pressable onPress={handleRegenerate} className="active:opacity-70">
                  <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
                    <Shuffle size={24} color="#FFF" />
                  </View>
                </Pressable>
              </View>
            </Animated.View>

            {/* Transcript Section */}
            <Animated.View entering={FadeInDown.delay(400).duration(600)} className="mb-8">
              <Pressable
                onPress={() => setShowTranscript(!showTranscript)}
                className="flex-row items-center justify-between mb-4 active:opacity-70"
              >
                <Text className="text-white text-xl font-semibold">
                  Affirmations ({session.affirmations.length})
                </Text>
                <Text className="text-white/70 text-sm">
                  {showTranscript ? 'Hide' : 'Show'}
                </Text>
              </Pressable>

              {showTranscript && session.affirmations.map((affirmation, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(index * 50).duration(400)}
                  className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl mb-3"
                >
                  <View className="flex-row">
                    <Text className="text-white/50 text-sm font-bold mr-3">
                      {(index + 1).toString().padStart(2, '0')}
                    </Text>
                    <Text className="text-white text-base leading-6 flex-1">
                      {affirmation}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Audio Mixer Modal */}
      <AudioMixerModal
        visible={showAudioMixer}
        onClose={() => setShowAudioMixer(false)}
        colors={goalColors[session.goal]}
      />
    </LinearGradient>
  );
};

export default PlaybackScreen;
