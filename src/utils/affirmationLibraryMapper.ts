/**
 * Utility functions to map affirmation library categories to binaural categories
 * and goals for backend compatibility
 */

import { getCategoryById } from "@/data/affirmationLibrary";

/**
 * Maps library category IDs to binaural category IDs
 * The library has 8 categories, but we currently support 5 binaural categories
 */
export function mapLibraryCategoryToBinauralCategory(
  libraryCategoryId: string
): "delta" | "theta" | "alpha" | "beta" | "gamma" {
  const category = getCategoryById(libraryCategoryId);
  if (!category) {
    // Default to alpha if category not found
    return "alpha";
  }

  const { min_hz, max_hz } = category.frequency_band;

  // Map based on frequency ranges
  if (min_hz >= 0.5 && max_hz <= 4.0) {
    return "delta"; // Sleep, Healing (delta range)
  } else if (min_hz >= 4.0 && max_hz <= 7.0) {
    return "theta"; // Manifest, Identity, Healing (theta range)
  } else if (min_hz >= 8.0 && max_hz <= 12.0) {
    return "alpha"; // Calm, Confidence (alpha range)
  } else if (min_hz >= 12.0 && max_hz <= 20.0) {
    return "beta"; // Focus, Confidence (beta range)
  } else if (min_hz >= 18.0 && max_hz <= 22.0) {
    return "beta"; // Energy (high beta, map to beta)
  } else if (min_hz >= 8.0 && max_hz <= 18.0) {
    return "beta"; // Confidence (alpha→beta, map to beta)
  } else {
    // Default to alpha
    return "alpha";
  }
}

/**
 * Maps library category IDs to goal types for backend compatibility
 * Currently supports: sleep, focus, calm, manifest
 */
export function mapLibraryCategoryToGoal(
  libraryCategoryId: string
): "sleep" | "focus" | "calm" | "manifest" {
  const mapping: Record<string, "sleep" | "focus" | "calm" | "manifest"> = {
    sleep: "sleep",
    calm: "calm",
    focus: "focus",
    manifest: "manifest",
    confidence: "focus", // Alpha→Beta maps to focus
    energy: "focus", // High Beta maps to focus
    healing: "calm", // Delta→Theta maps to calm
    identity: "manifest", // Theta maps to manifest
  };

  return mapping[libraryCategoryId] || "calm";
}

/**
 * Gets the Hz range string for a library category
 */
export function getHzRangeForLibraryCategory(libraryCategoryId: string): string {
  const category = getCategoryById(libraryCategoryId);
  if (!category) {
    return "8-14"; // Default alpha range
  }

  const { min_hz, max_hz } = category.frequency_band;
  return `${min_hz}-${max_hz}`;
}

