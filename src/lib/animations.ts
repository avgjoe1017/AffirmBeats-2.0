import { Easing } from "react-native-reanimated";

/**
 * Slow UI Aesthetic - Centralized Animation Constants
 * 
 * Standardizes all transitions to create a calm, premium feel:
 * - Navigation transitions: 150-250ms with fade + 10-20px slide
 * - Component transitions: Fade in 150-200ms, Fade out 150ms
 * - Modal scale: 0.97 → 1.0 over 180ms
 * - Easing: Easing.out(Easing.quad)
 * 
 * Reference: UX_UPGRADES_SPEC.md Section 3
 */

// ============================================================================
// DURATIONS
// ============================================================================

/** Navigation transition duration (150-250ms) */
export const NAVIGATION_DURATION = 200;

/** Component fade in duration (150-200ms) */
export const FADE_IN_DURATION = 180;

/** Component fade out duration (150ms) */
export const FADE_OUT_DURATION = 150;

/** Modal scale animation duration (180ms) */
export const MODAL_SCALE_DURATION = 180;

/** Slide distance for navigation transitions (10-20px) */
export const SLIDE_DISTANCE = 15;

// ============================================================================
// EASING
// ============================================================================

/** Standard easing for all transitions */
export const STANDARD_EASING = Easing.out(Easing.quad);

/** Easing for modal scale animations */
export const MODAL_EASING = Easing.out(Easing.quad);

// ============================================================================
// SCALE VALUES
// ============================================================================

/** Initial modal scale (0.97) */
export const MODAL_INITIAL_SCALE = 0.97;

/** Final modal scale (1.0) */
export const MODAL_FINAL_SCALE = 1.0;

// ============================================================================
// REANIMATED ANIMATION HELPERS
// ============================================================================

import { FadeIn, FadeOut, FadeInDown, FadeOutDown, SlideInDown, SlideOutDown } from "react-native-reanimated";

/**
 * Standard fade in animation for components
 * Duration: 180ms
 * Easing: Easing.out(Easing.quad)
 */
export const standardFadeIn = FadeIn.duration(FADE_IN_DURATION).easing(STANDARD_EASING);

/**
 * Standard fade out animation for components
 * Duration: 150ms
 * Easing: Easing.out(Easing.quad)
 */
export const standardFadeOut = FadeOut.duration(FADE_OUT_DURATION).easing(STANDARD_EASING);

/**
 * Standard fade in down animation for components
 * Duration: 180ms
 * Easing: Easing.out(Easing.quad)
 */
export const standardFadeInDown = FadeInDown.duration(FADE_IN_DURATION).easing(STANDARD_EASING);

/**
 * Standard fade out down animation for components
 * Duration: 150ms
 * Easing: Easing.out(Easing.quad)
 */
export const standardFadeOutDown = FadeOutDown.duration(FADE_OUT_DURATION).easing(STANDARD_EASING);

/**
 * Standard slide in down animation for modals
 * Duration: 180ms
 * Easing: Easing.out(Easing.quad)
 */
export const standardSlideInDown = SlideInDown.duration(MODAL_SCALE_DURATION).easing(MODAL_EASING);

/**
 * Standard slide out down animation for modals
 * Duration: 150ms
 * Easing: Easing.out(Easing.quad)
 */
export const standardSlideOutDown = SlideOutDown.duration(FADE_OUT_DURATION).easing(STANDARD_EASING);

/**
 * Fade in with delay
 * @param delay - Delay in milliseconds
 */
export const fadeInWithDelay = (delay: number) => 
  FadeIn.delay(delay).duration(FADE_IN_DURATION).easing(STANDARD_EASING);

/**
 * Fade in down with delay
 * @param delay - Delay in milliseconds
 */
export const fadeInDownWithDelay = (delay: number) => 
  FadeInDown.delay(delay).duration(FADE_IN_DURATION).easing(STANDARD_EASING);

// ============================================================================
// REACT NAVIGATION TRANSITION CONFIG
// ============================================================================

/**
 * Standard navigation transition config for React Navigation Native Stack
 * 
 * Note: React Navigation Native Stack uses native animations,
 * so we configure animation duration and easing through screen options.
 * The native stack supports fade and slide animations with duration control.
 * 
 * Duration: 200ms
 * Easing: Easing.out(Easing.quad) (handled by native)
 * Uses fade + slide (10-20px) - handled by native stack
 */
export const standardNavigationOptions = {
  animationDuration: NAVIGATION_DURATION,
  // Native stack animations are handled by the animation prop:
  // - "default" - fade + slide
  // - "fade" - fade only
  // - "slide_from_bottom" - slide from bottom
  // - "slide_from_right" - slide from right
  // - "slide_from_left" - slide from left
  // Duration is controlled by animationDuration
};

// ============================================================================
// MODAL ANIMATIONS
// ============================================================================

/**
 * Modal scale animation config
 * Scale: 0.97 → 1.0
 * Duration: 180ms
 * Easing: Easing.out(Easing.quad)
 */
export const modalScaleConfig = {
  initialScale: MODAL_INITIAL_SCALE,
  finalScale: MODAL_FINAL_SCALE,
  duration: MODAL_SCALE_DURATION,
  easing: MODAL_EASING,
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Durations
  NAVIGATION_DURATION,
  FADE_IN_DURATION,
  FADE_OUT_DURATION,
  MODAL_SCALE_DURATION,
  SLIDE_DISTANCE,
  
  // Easing
  STANDARD_EASING,
  MODAL_EASING,
  
  // Scale values
  MODAL_INITIAL_SCALE,
  MODAL_FINAL_SCALE,
  
  // Animation helpers
  standardFadeIn,
  standardFadeOut,
  standardFadeInDown,
  standardFadeOutDown,
  standardSlideInDown,
  standardSlideOutDown,
  fadeInWithDelay,
  fadeInDownWithDelay,
  
  // Navigation config
  standardNavigationOptions,
  
  // Modal config
  modalScaleConfig,
};

