import React, { useEffect } from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { X } from "lucide-react-native";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useAppStore } from "@/state/appStore";
import { MODAL_INITIAL_SCALE, MODAL_FINAL_SCALE, MODAL_SCALE_DURATION, MODAL_EASING, FADE_OUT_DURATION, STANDARD_EASING } from "@/lib/animations";

interface AudioMixerModalProps {
  visible: boolean;
  onClose: () => void;
  colors: [string, string];
}

const AudioMixerModal = ({ visible, onClose, colors }: AudioMixerModalProps) => {
  const audioMixerVolumes = useAppStore((s) => s.audioMixerVolumes);
  const setAffirmationsVolume = useAppStore((s) => s.setAffirmationsVolume);
  const setBinauralBeatsVolume = useAppStore((s) => s.setBinauralBeatsVolume);
  const setBackgroundNoiseVolume = useAppStore((s) => s.setBackgroundNoiseVolume);

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[{ flex: 1 }, animatedOverlayStyle]}>
        <Pressable className="flex-1 bg-black/70 justify-end" onPress={onClose}>
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
            colors={colors}
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
              <Text className="text-white text-2xl font-bold">Audio Mixer</Text>
              <Pressable onPress={onClose} className="active:opacity-70">
                <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                  <X size={20} color="#FFF" />
                </View>
              </Pressable>
            </View>

            {/* Affirmations Slider */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white/90 text-lg font-semibold">
                  Affirmations
                </Text>
                <Text className="text-white/70 text-base font-medium">
                  {audioMixerVolumes.affirmations}%
                </Text>
              </View>
              <Slider
                value={audioMixerVolumes.affirmations}
                onValueChange={setAffirmationsVolume}
                minimumValue={0}
                maximumValue={100}
                step={1}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor="#FFFFFF"
                style={{ width: "100%", height: 40 }}
              />
            </View>

            {/* Binaural Beats Slider */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white/90 text-lg font-semibold">
                  Binaural Beats
                </Text>
                <Text className="text-white/70 text-base font-medium">
                  {audioMixerVolumes.binauralBeats}%
                </Text>
              </View>
              <Slider
                value={audioMixerVolumes.binauralBeats}
                onValueChange={setBinauralBeatsVolume}
                minimumValue={0}
                maximumValue={100}
                step={1}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor="#FFFFFF"
                style={{ width: "100%", height: 40 }}
              />
            </View>

            {/* Background Noise Slider */}
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white/90 text-lg font-semibold">
                  Background Noise
                </Text>
                <Text className="text-white/70 text-base font-medium">
                  {audioMixerVolumes.backgroundNoise}%
                </Text>
              </View>
              <Slider
                value={audioMixerVolumes.backgroundNoise}
                onValueChange={setBackgroundNoiseVolume}
                minimumValue={0}
                maximumValue={100}
                step={1}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor="#FFFFFF"
                style={{ width: "100%", height: 40 }}
              />
            </View>

            {/* Info Text */}
            <Text className="text-white/60 text-sm text-center mt-4">
              Adjust volume levels for each audio layer
            </Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default AudioMixerModal;
