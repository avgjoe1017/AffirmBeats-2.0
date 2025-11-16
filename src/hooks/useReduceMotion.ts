import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * Hook to check if Reduce Motion is enabled
 * Returns true if user has enabled Reduce Motion in system settings
 * 
 * On iOS: Settings > Accessibility > Motion > Reduce Motion
 * On Android: Settings > Accessibility > Remove animations
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check initial state
    if (Platform.OS === "ios") {
      AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    } else {
      // Android: Check if animations are disabled
      AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    }

    // Listen for changes (iOS only, Android doesn't support this)
    if (Platform.OS === "ios") {
      const subscription = AccessibilityInfo.addEventListener(
        "reduceMotionChanged",
        (event) => {
          setReduceMotion(event);
        }
      );

      return () => {
        subscription?.remove();
      };
    }
  }, []);

  return reduceMotion;
}

