import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";

interface PlaybackRingEffectsProps {
  isPlaying: boolean;
  size: number;
  color: string;
}

/**
 * Sparkle Component (Headspace Style)
 * 
 * Small particles that drift outward and fade
 * Size: 1-3px
 * Drift: 4-8px over 1.5-3s
 * Opacity: fade to zero
 */
const Sparkle = ({ index, isPlaying, size }: { index: number; isPlaying: boolean; size: number }) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Random starting position on a circle
  const angle = (index * 60) % 360;
  const radius = size * 0.35;
  const startX = Math.cos((angle * Math.PI) / 180) * radius;
  const startY = Math.sin((angle * Math.PI) / 180) * radius;

  // Random drift distance
  const driftDistance = 4 + (index % 4);
  const duration = 1500 + (index % 1500);

  useEffect(() => {
    if (isPlaying) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: duration * 0.3, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: duration * 0.7, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );

      translateX.value = withRepeat(
        withTiming(driftDistance, { duration, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );

      translateY.value = withRepeat(
        withTiming(driftDistance * 0.7, { duration, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
    } else {
      opacity.value = 0;
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [isPlaying, driftDistance, duration, opacity, translateX, translateY]);

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const sparkleSize = 2 + (index % 2);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX + size / 2,
          top: startY + size / 2,
          width: sparkleSize,
          height: sparkleSize,
          borderRadius: sparkleSize / 2,
          backgroundColor: "#FFFFFF",
        },
        sparkleStyle,
      ]}
    />
  );
};

/**
 * Ring Pulse Effect (Headspace Style)
 * 
 * Subtle scale animation on the ring
 * Scale: 1.00 → 1.015 → 1.00
 * Duration: 3-4s
 */
const RingPulse = ({ isPlaying, size, color }: { isPlaying: boolean; size: number; color: string }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.015, { duration: 1750, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.0, { duration: 1750, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      scale.value = 1;
    }
  }, [isPlaying, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size * 0.85,
          height: size * 0.85,
          borderRadius: size,
          borderWidth: 2,
          borderColor: color,
          opacity: 0.3,
        },
        pulseStyle,
      ]}
    />
  );
};

/**
 * Ambient Particle (Headspace Style)
 * 
 * Soft dots that move slowly and oscillate in opacity
 * Size: 2-4px
 * Movement: 0.3-0.6 px/sec
 * Opacity: 40% → 80% → 40%
 */
const AmbientParticle = ({ index, isPlaying, size }: { index: number; isPlaying: boolean; size: number }) => {
  const opacity = useSharedValue(0.4);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Random starting position
  const startX = ((index * 37) % size) - size / 2;
  const startY = ((index * 53) % size) - size / 2;

  // Slow movement
  const moveDistance = 8 + (index % 6);
  const duration = 8000 + (index % 4000);

  useEffect(() => {
    if (isPlaying) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.4, { duration: duration / 2, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );

      translateX.value = withRepeat(
        withTiming(moveDistance, { duration, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );

      translateY.value = withRepeat(
        withTiming(moveDistance * 0.6, { duration: duration * 1.2, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      opacity.value = 0;
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [isPlaying, moveDistance, duration, opacity, translateX, translateY]);

  const particleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const particleSize = 3 + (index % 2);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX + size / 2,
          top: startY + size / 2,
          width: particleSize,
          height: particleSize,
          borderRadius: particleSize / 2,
          backgroundColor: "#FFFFFF",
        },
        particleStyle,
      ]}
    />
  );
};

/**
 * Playback Ring Effects Component
 * 
 * Combines sparkles, ambient particles, and ring pulse
 * for a premium, Headspace-style micro-illustration effect
 */
const PlaybackRingEffects: React.FC<PlaybackRingEffectsProps> = ({ isPlaying, size, color }) => {
  // Create 6 sparkles
  const sparkles = Array.from({ length: 6 }, (_, i) => i);
  
  // Create 6 ambient particles
  const particles = Array.from({ length: 6 }, (_, i) => i);

  return (
    <View
      style={{
        position: "absolute",
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Ring Pulse */}
      <RingPulse isPlaying={isPlaying} size={size} color={color} />

      {/* Sparkles */}
      {sparkles.map((i) => (
        <Sparkle key={`sparkle-${i}`} index={i} isPlaying={isPlaying} size={size} />
      ))}

      {/* Ambient Particles */}
      {particles.map((i) => (
        <AmbientParticle key={`particle-${i}`} index={i} isPlaying={isPlaying} size={size} />
      ))}
    </View>
  );
};

export default PlaybackRingEffects;

