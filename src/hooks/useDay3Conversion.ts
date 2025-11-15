import { useEffect } from "react";
import { useAppStore } from "@/state/appStore";

/**
 * Day 3 Conversion Hook
 * 
 * Tracks unique days of usage and determines if Day 3 banner should be shown
 * Shows banner once after 3rd day, never again after dismissing
 */
export const useDay3Conversion = (): {
  shouldShowBanner: boolean;
  dismissBanner: () => void;
} => {
  const uniqueDaysUsed = useAppStore((s) => s.uniqueDaysUsed);
  const addUsageDay = useAppStore((s) => s.addUsageDay);
  const hasSeenDay3Banner = useAppStore((s) => s.hasSeenDay3Banner);
  const setHasSeenDay3Banner = useAppStore((s) => s.setHasSeenDay3Banner);
  const subscription = useAppStore((s) => s.subscription);

  // Track today's usage
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    addUsageDay(today);
  }, [addUsageDay]);

  // Determine if banner should be shown
  const shouldShowBanner =
    !hasSeenDay3Banner &&
    uniqueDaysUsed.length >= 3 &&
    subscription?.tier !== "pro";

  const dismissBanner = () => {
    setHasSeenDay3Banner(true);
  };

  return {
    shouldShowBanner,
    dismissBanner,
  };
};

