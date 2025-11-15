import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

interface CinematicOpenerProps {
  onComplete: () => void;
}

/**
 * Cinematic Opener Component (Calm Style)
 * 
 * Premium startup animation with:
 * - Logo fade-in (0% → 100%) over 450ms
 * - Glow bloom (shadow blur 0 → 12 → 0) over 600ms
 * - Scale animation (0.95 → 1.0) over 500ms
 * - Full fade out over 200-300ms
 * 
 * Total duration: ~1.0-1.5 seconds
 */
const CinematicOpener: React.FC<CinematicOpenerProps> = ({ onComplete }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo fade-in: 0% → 100% over 450ms
    opacity.value = withTiming(1, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });

    // Scale: 0.95 → 1.0 over 500ms
    scale.value = withTiming(1.0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    // Glow bloom: 0 → 1 → 0 over 600ms (concurrent)
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
    );

    // After 1000ms, start fade out and complete
    const fadeOutTimer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        {
          duration: 250,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        }
      );
    }, 1000);

    return () => clearTimeout(fadeOutTimer);
  }, [opacity, scale, glowOpacity, onComplete]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.6,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F0F1E", "#1A1A2E", "#0F0F1E"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow effect behind logo */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <View style={styles.glow} />
      </Animated.View>

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Sparkles size={64} color="#8B7AB8" strokeWidth={1.5} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F1E",
  },
  glowContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#8B7AB8",
    shadowColor: "#8B7AB8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});

export default CinematicOpener;

