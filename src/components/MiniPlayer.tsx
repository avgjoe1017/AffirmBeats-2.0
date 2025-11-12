import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Pause, X } from "lucide-react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppStore } from "@/state/appStore";
import type { RootStackParamList } from "@/navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MiniPlayer = () => {
  const navigation = useNavigation<NavigationProp>();
  const currentSession = useAppStore((s) => s.currentSession);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);
  const currentTime = useAppStore((s) => s.currentTime);
  const setCurrentSession = useAppStore((s) => s.setCurrentSession);
  const setCurrentTime = useAppStore((s) => s.setCurrentTime);

  if (!currentSession) return null;

  const goalColors: Record<string, [string, string]> = {
    sleep: ["#2D1B69", "#8B7AB8"],
    focus: ["#FF9966", "#FF6B35"],
    calm: ["#44B09E", "#6BB6FF"],
    manifest: ["#9333EA", "#F59E0B"],
  };

  const progress = currentSession.lengthSec > 0
    ? (currentTime / currentSession.lengthSec) * 100
    : 0;

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClose = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentSession(null);
  };

  const handleOpenFullPlayer = () => {
    navigation.navigate("Playback", { sessionId: currentSession.sessionId });
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutDown.duration(300)}
      style={{
        position: "absolute",
        bottom: 60, // Above tab bar
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 16,
      }}
    >
      <Pressable onPress={handleOpenFullPlayer} className="active:opacity-90">
        <LinearGradient
          colors={goalColors[currentSession.goal] || ["#333", "#555"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 16,
            padding: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {/* Progress Bar */}
          <View className="absolute top-0 left-0 right-0 h-1 bg-white/20 rounded-t-2xl overflow-hidden">
            <View
              className="h-full bg-white"
              style={{ width: `${progress}%` }}
            />
          </View>

          {/* Content */}
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-1 mr-3">
              <Text className="text-white text-base font-bold" numberOfLines={1}>
                {currentSession.title}
              </Text>
              <Text className="text-white/70 text-xs mt-0.5 capitalize">
                {currentSession.goal} • {isPlaying ? "Playing" : "Paused"}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              {/* Play/Pause Button */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleTogglePlay();
                }}
                className="active:opacity-70"
              >
                <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                  {isPlaying ? (
                    <Pause size={20} color="#FFF" fill="#FFF" />
                  ) : (
                    <Play size={20} color="#FFF" fill="#FFF" style={{ marginLeft: 2 }} />
                  )}
                </View>
              </Pressable>

              {/* Close Button */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="active:opacity-70"
              >
                <X size={20} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default MiniPlayer;
