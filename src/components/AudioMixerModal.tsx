import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { X } from "lucide-react-native";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAppStore } from "@/state/appStore";

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-end">
        <Pressable className="flex-1" onPress={onClose} />

        <Animated.View entering={FadeIn.duration(300)}>
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
      </View>
    </Modal>
  );
};

export default AudioMixerModal;
