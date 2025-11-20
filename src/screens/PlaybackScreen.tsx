import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, Pressable, ScrollView, AppState, AppStateStatus, Dimensions, Alert } from "react-native";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Pause, Heart, RotateCcw, Shuffle, ChevronDown, Settings, Copy, Check } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { setAudioModeAsync } from "expo-audio";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import type { RootStackScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/appStore";
import type { GetSessionsResponse } from "@/shared/contracts";
import { api, BACKEND_URL } from "@/lib/api";
import AudioMixerModal from "@/components/AudioMixerModal";
import PlaybackRingEffects from "@/components/PlaybackRingEffects";
import { useAudioManager } from "@/utils/audioManager";
import { getBinauralBeatUrl, getBackgroundSoundUrl, type BinauralCategory, type BackgroundSound } from "@/utils/audioFiles";
import { useSpatialPanningSimple } from "@/hooks/useSpatialPanning";
import { useAnimatedReaction, runOnJS } from "react-native-reanimated";

type Props = RootStackScreenProps<"Playback">;
type Session = GetSessionsResponse["sessions"][0];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VISUALIZATION_SIZE = Math.min(SCREEN_WIDTH - 96, 280);

// Floating Particle Component - Like dust particles in light
const FloatingParticle = ({ index, isPlaying }: { index: number; isPlaying: boolean }) => {
  const reduceMotion = useReduceMotion();
  const floatX = useSharedValue(0);
  const floatY = useSharedValue(0);
  const fadeAnim = useSharedValue(0);

  // Random starting positions and movement patterns for organic feel
  const startX = (index * 37) % VISUALIZATION_SIZE;
  const startY = (index * 53) % VISUALIZATION_SIZE;
  const movePattern = (index % 3) + 1;

  useEffect(() => {
    if (reduceMotion) {
      // If Reduce Motion is enabled, keep particles static with minimal opacity
      floatX.value = 0;
      floatY.value = 0;
      fadeAnim.value = isPlaying ? 0.2 : 0;
      return;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, index, reduceMotion]); // floatX, floatY, fadeAnim, movePattern are stable shared values

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
  const reduceMotion = useReduceMotion();
  const breathe = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      // If Reduce Motion is enabled, keep circle static
      breathe.value = 0.5; // Static at mid-opacity
      rotate.value = 0;
      return;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, reduceMotion]); // breathe and rotate are stable shared values

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
  const preferences = useAppStore((s) => s.preferences);
  const subscription = useAppStore((s) => s.subscription);

  const [showTranscript, setShowTranscript] = useState(false);
  const [showAudioMixer, setShowAudioMixer] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Audio manager for multi-track playback
  const audioManager = useAudioManager();
  
  // Get volume settings from store
  const audioMixerVolumes = useAppStore((s) => s.audioMixerVolumes);

  // Use ref to track currentSession to avoid dependency issues
  const currentSessionRef = useRef(currentSession);
  currentSessionRef.current = currentSession;

  // Find session from library or use current session
  // Don't include currentSession in deps to prevent recalculation loops
  const session = useMemo(() => {
    const foundInSessions = sessions.find((s) => s.id === sessionId);
    if (foundInSessions) return foundInSessions;
    
    // Fallback to currentSession only if not in sessions array
    // Use ref to avoid dependency on currentSession
    const current = currentSessionRef.current;
    if (current?.sessionId === sessionId) {
      return {
        id: current.sessionId,
        title: current.title,
        goal: current.goal,
        affirmations: current.affirmations,
        lengthSec: current.lengthSec,
        voiceId: current.voiceId,
        pace: current.pace,
        noise: current.noise,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        binauralCategory: current.binauralCategory,
        binauralHz: current.binauralHz,
      };
    }
    return null;
  }, [sessions, sessionId]); // Removed currentSession from deps - use ref instead

  // Spatial panning for background sounds (Endel style)
  // Only active when background sound is playing and available
  const hasBackgroundSound = session?.noise && session.noise !== "none";
  const spatialPan = useSpatialPanningSimple({
    isActive: isPlaying && hasBackgroundSound === true,
    cycleDuration: 25000, // 25 seconds (middle of 20-30s range)
    minPan: -0.25,
    maxPan: 0.25,
  });

  // Track the last session ID we set to prevent infinite loops
  const lastSetSessionIdRef = useRef<string | null>(null);

  // Set this session as the current session for MiniPlayer to work
  // Use ref to prevent infinite loops when session object changes
  useEffect(() => {
    if (session && session.id !== lastSetSessionIdRef.current) {
      // Only set if it's different from what we last set
      if (!currentSession || currentSession.sessionId !== session.id) {
        console.log("[PlaybackScreen] Setting current session for MiniPlayer:", session.id);
        lastSetSessionIdRef.current = session.id; // Track what we're setting
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, setCurrentSession]); // Only depend on session ID, not currentSession (use ref check instead)

  // Memoize session lookup calculations to prevent unnecessary re-renders
  const foundInSessions = useMemo(() => 
    !!sessions.find((s) => s.id === sessionId),
    [sessions, sessionId]
  );
  const foundInCurrentSession = useMemo(() => 
    currentSession?.sessionId === sessionId,
    [currentSession, sessionId]
  );

  // Debug logging only when session state actually changes
  useEffect(() => {
    console.log("[PlaybackScreen] Session lookup:", {
      sessionId,
      found: !!session,
      goal: session?.goal,
      foundInSessions,
      foundInCurrentSession,
      totalSessions: sessions.length
    });
  }, [sessionId, session, foundInSessions, foundInCurrentSession, sessions.length]);

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

  // Load audio tracks when session changes
  useEffect(() => {
    if (!session) return;

    const loadAudio = async () => {
      try {
        setIsLoadingAudio(true);
        console.log("[PlaybackScreen] Loading audio for session:", session.id);

        // Load affirmations playlist (NEW: individual affirmation audio files)
        // Fallback to legacy system if session doesn't have an ID (e.g., default sessions)
        if (session.id && !session.id.startsWith("default-")) {
          try {
            await audioManager.loadAffirmationPlaylist(session.id);
          } catch (error) {
            console.error("[PlaybackScreen] Failed to load playlist - session may not have individual affirmations yet:", error);
            // Fallback to legacy system only as last resort
            console.warn("[PlaybackScreen] Falling back to legacy TTS system");
            await audioManager.loadAffirmations(
              session.affirmations,
              (session.voiceId || "neutral") as "neutral" | "confident" | "whisper",
              (session.pace || "normal") as "slow" | "normal",
              preferences.affirmationSpacing || 8,
              session.goal as "sleep" | "focus" | "calm" | "manifest" | undefined
            );
          }
        } else {
          // Legacy system for default sessions or sessions without IDs
          await audioManager.loadAffirmations(
            session.affirmations,
            (session.voiceId || "neutral") as "neutral" | "confident" | "whisper",
            (session.pace || "normal") as "slow" | "normal",
            preferences.affirmationSpacing || 8,
            session.goal as "sleep" | "focus" | "calm" | "manifest" | undefined
          );
        }

        // Load binaural beats if category is available
        // Prefer optimized files (3-minute AAC loops) over legacy WAV files
        if (session.binauralCategory) {
          try {
            const binauralUrl = getBinauralBeatUrl(
              session.binauralCategory as BinauralCategory,
              BACKEND_URL,
              true // useOptimized = true (prefer optimized files)
            );
            console.log("[PlaybackScreen] Loading binaural beats from:", binauralUrl);
            await audioManager.loadBinauralBeats(binauralUrl);
          } catch (error) {
            console.warn("[PlaybackScreen] Could not load binaural beats:", error);
          }
        }

        // Load background noise
        const hasPremiumAccess = subscription?.tier === "pro";
        const backgroundUrl = getBackgroundSoundUrl(
          (session.noise || "none") as BackgroundSound, 
          BACKEND_URL,
          true, // useOptimized
          hasPremiumAccess
        );
        if (backgroundUrl) {
          try {
            console.log("[PlaybackScreen] Loading background sound from:", backgroundUrl);
            await audioManager.loadBackgroundNoise(backgroundUrl);
          } catch (error) {
            console.warn("[PlaybackScreen] Could not load background noise:", error);
          }
        }

        // Apply volume settings
        await audioManager.setAffirmationsVolume(audioMixerVolumes.affirmations);
        await audioManager.setBinauralBeatsVolume(audioMixerVolumes.binauralBeats);
        await audioManager.setBackgroundNoiseVolume(audioMixerVolumes.backgroundNoise);

        console.log("[PlaybackScreen] Audio loaded successfully");
      } catch (error) {
        console.error("[PlaybackScreen] Failed to load audio:", error);
      } finally {
        setIsLoadingAudio(false);
      }
    };

    loadAudio();

    // Cleanup on unmount or session change
    return () => {
      audioManager.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]); // Only reload when session ID changes - audioManager is stable

  // Sync audio manager state with app store
  // Use refs to track last values and prevent infinite loops
  const lastIsPlayingRef = useRef(audioManager.isPlaying);
  const lastCurrentTimeRef = useRef(0);

  useEffect(() => {
    // Update playing state only when it actually changes
    if (audioManager.isPlaying !== lastIsPlayingRef.current) {
      lastIsPlayingRef.current = audioManager.isPlaying;
      setIsPlaying(audioManager.isPlaying);
    }

    // Update time at most once per second to prevent render spam
    const interval = setInterval(() => {
      if (audioManager.isPlaying) {
        const roundedTime = Math.floor(audioManager.currentTime);
        const lastRoundedTime = Math.floor(lastCurrentTimeRef.current);
        if (roundedTime !== lastRoundedTime) {
          lastCurrentTimeRef.current = audioManager.currentTime;
          setCurrentTime(audioManager.currentTime);
        }
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioManager.isPlaying, setIsPlaying, setCurrentTime]); // Removed isPlaying and currentTime from deps to prevent loops

  // Update volumes when they change
  useEffect(() => {
    const updateVolumes = async () => {
      await Promise.all([
        audioManager.setAffirmationsVolume(audioMixerVolumes.affirmations),
        audioManager.setBinauralBeatsVolume(audioMixerVolumes.binauralBeats),
        audioManager.setBackgroundNoiseVolume(audioMixerVolumes.backgroundNoise),
      ]);
    };
    updateVolumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioMixerVolumes.affirmations, audioMixerVolumes.binauralBeats, audioMixerVolumes.backgroundNoise]); // audioManager is stable

  // Update spatial panning for background sounds
  // Use animated reaction to sync pan value with audio manager
  useAnimatedReaction(
    () => spatialPan.value,
    (panValue) => {
      // Update pan value in audio manager
      // Note: This will be a no-op with expo-av, but prepares for future migration
      runOnJS(audioManager.setBackgroundNoisePan)(panValue);
    },
    [spatialPan]
  );

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

  const togglePlay = async () => {
    if (isLoadingAudio) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isPlaying) {
      await audioManager.pause();
    } else {
      await audioManager.play();
    }
  };

  const handleCopyAffirmation = async (affirmation: string, index: number) => {
    await Clipboard.setStringAsync(affirmation);
    setCopiedIndex(index);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRestart = async () => {
    await audioManager.seek(0);
    await audioManager.play();
  };

  const handleRegenerate = () => {
    // Navigate back to generation screen with same goal
    const goal = session.goal as "sleep" | "focus" | "calm" | "manifest";
    navigation.navigate("Generation", { goal });
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
  // Memoize to prevent unnecessary recalculations on every render
  const sessionInLibrary = useMemo(() => 
    sessions.find((s) => s.id === sessionId),
    [sessions, sessionId]
  );
  const isFavorited = sessionInLibrary?.isFavorite ?? false;

  // Debug logging only when session state actually changes
  useEffect(() => {
    console.log("[PlaybackScreen] Render - isFavorited:", isFavorited, "sessionInLibrary:", !!sessionInLibrary);
  }, [isFavorited, sessionInLibrary]);

  const progress = session ? (currentTime / session.lengthSec) * 100 : 0;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient 
        colors={goalColors[session.goal]} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          opacity: 0.98,
        }}
      >
        {/* Subtle texture overlay */}
        <View 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.02)',
            opacity: 0.3,
          }}
        />
      </LinearGradient>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-5">
            <Pressable onPress={handleGoBack} className="active:opacity-70">
              <ChevronDown size={32} color="#FFF" strokeWidth={2} />
            </Pressable>
            <View className="flex-row items-center gap-5">
              <Pressable onPress={() => setShowAudioMixer(true)} className="active:opacity-70">
                <Settings size={32} color="#FFF" strokeWidth={2} />
              </Pressable>
              <Pressable onPress={toggleFavorite} className="active:opacity-70">
                <Heart
                  size={32}
                  color="#FFF"
                  fill={isFavorited ? "#FFF" : "transparent"}
                  strokeWidth={2}
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
                <View style={{ position: "relative" }}>
                  <OrganicWaveVisualizer
                    progress={progress}
                    isPlaying={isPlaying}
                    colors={goalColors[session.goal]}
                  />
                  {/* Micro-illustrations overlay */}
                  <PlaybackRingEffects
                    isPlaying={isPlaying}
                    size={VISUALIZATION_SIZE}
                    color={goalColors[session.goal][1]}
                  />
                </View>
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
                className="flex-row items-center justify-between mb-4 active:opacity-70 bg-white/5 p-4 rounded-2xl border border-white/10"
              >
                <View className="flex-row items-center">
                  <Text className="text-white text-xl font-semibold">
                    Affirmations ({session.affirmations.length})
                  </Text>
                  <ChevronDown 
                    size={20} 
                    color="#FFF" 
                    style={{ 
                      marginLeft: 8, 
                      transform: [{ rotate: showTranscript ? '180deg' : '0deg' }] 
                    }} 
                  />
                </View>
                <Text className="text-white/70 text-sm font-medium">
                  {showTranscript ? 'Hide' : 'Tap to view'}
                </Text>
              </Pressable>

              {showTranscript && session.affirmations.map((affirmation, index) => (
                <Pressable
                  key={index}
                  onLongPress={() => handleCopyAffirmation(affirmation, index)}
                  delayLongPress={500}
                >
                  <Animated.View
                    entering={FadeInDown.delay(index * 50).duration(400)}
                    className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl mb-3 border border-white/5"
                  >
                    <View className="flex-row items-start">
                      <Text className="text-white/50 text-sm font-bold mr-3 mt-1">
                        {(index + 1).toString().padStart(2, '0')}
                      </Text>
                      <Text className="text-white/95 text-base leading-6 flex-1">
                        {affirmation}
                      </Text>
                      {copiedIndex === index ? (
                        <Check size={18} color="#44B09E" style={{ marginLeft: 8, marginTop: 2 }} />
                      ) : (
                        <Copy size={18} color="#FFFFFF40" style={{ marginLeft: 8, marginTop: 2 }} />
                      )}
                    </View>
                  </Animated.View>
                </Pressable>
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
    </View>
  );
};

export default PlaybackScreen;
