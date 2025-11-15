import { useEffect } from "react";
import { useSharedValue, withRepeat, withTiming, withSequence, Easing } from "react-native-reanimated";

/**
 * Spatial Audio Panning Hook (Endel Style)
 * 
 * Provides animated panning values for background sounds
 * - Panning range: -0.25 → +0.25
 * - Cycle duration: 20-30 seconds
 * - Easing: inOut(Easing.quad)
 * 
 * Reference: UX_UPGRADES_SPEC.md Section 9
 */

interface UseSpatialPanningOptions {
  /** Whether panning is active (should be true when background sound is playing) */
  isActive: boolean;
  /** Cycle duration in milliseconds (20000-30000ms) */
  cycleDuration?: number;
  /** Minimum pan value (default: -0.25) */
  minPan?: number;
  /** Maximum pan value (default: 0.25) */
  maxPan?: number;
}

/**
 * Hook that provides animated panning values for spatial audio
 * 
 * @param options - Configuration options for panning
 * @returns Animated pan value (-0.25 to 0.25)
 */
export const useSpatialPanning = ({
  isActive,
  cycleDuration = 25000, // 25 seconds (in the middle of 20-30s range)
  minPan = -0.25,
  maxPan = 0.25,
}: UseSpatialPanningOptions) => {
  const pan = useSharedValue(0); // Start at center (0)

  useEffect(() => {
    if (isActive) {
      // Create a continuous oscillation: -0.25 → +0.25 → -0.25
      // Using withRepeat with reverse to create smooth back-and-forth motion
      pan.value = withRepeat(
        withSequence(
          // Animate from center to max
          withTiming(maxPan, {
            duration: cycleDuration / 2,
            easing: Easing.inOut(Easing.quad),
          }),
          // Animate from max to min (passing through center)
          withTiming(minPan, {
            duration: cycleDuration,
            easing: Easing.inOut(Easing.quad),
          }),
          // Animate from min back to center
          withTiming(0, {
            duration: cycleDuration / 2,
            easing: Easing.inOut(Easing.quad),
          })
        ),
        -1, // Infinite repeat
        false // Don't reverse (we handle the full cycle manually)
      );
    } else {
      // Reset to center when not active
      pan.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [isActive, cycleDuration, minPan, maxPan, pan]);

  return pan;
};

/**
 * Alternative implementation: Simpler back-and-forth oscillation
 * This version oscillates between min and max more smoothly
 */
export const useSpatialPanningSimple = ({
  isActive,
  cycleDuration = 25000,
  minPan = -0.25,
  maxPan = 0.25,
}: UseSpatialPanningOptions) => {
  const pan = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Start from center (0) and oscillate between min and max
      // This creates a smooth back-and-forth motion
      pan.value = 0; // Start at center
      pan.value = withRepeat(
        withSequence(
          // Animate from center to max
          withTiming(maxPan, {
            duration: cycleDuration / 2,
            easing: Easing.inOut(Easing.quad),
          }),
          // Animate from max to min
          withTiming(minPan, {
            duration: cycleDuration,
            easing: Easing.inOut(Easing.quad),
          }),
          // Animate from min back to center
          withTiming(0, {
            duration: cycleDuration / 2,
            easing: Easing.inOut(Easing.quad),
          })
        ),
        -1, // Infinite repeat
        false // Don't reverse (we handle the full cycle)
      );
    } else {
      // Reset to center when not active
      pan.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [isActive, cycleDuration, minPan, maxPan, pan]);

  return pan;
};

