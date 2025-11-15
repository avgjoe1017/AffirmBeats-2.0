/**
 * Audio file mappings for binaural beats and background sounds
 * 
 * Maps user preferences to actual audio file paths.
 * 
 * OPTIMIZED FILES (Recommended):
 * - 3-minute loops in AAC/M4A format (2-5 MB each)
 * - Located in assets/audio/binaural/ and assets/audio/solfeggio/
 * - See MD_DOCS/AUDIO_OPTIMIZATION.md for conversion pipeline
 * 
 * LEGACY FILES (Fallback):
 * - Original WAV files (600+ MB each)
 * - Served from backend at /api/audio/binaural/ and /api/audio/background/
 * 
 * The system prefers optimized files when available, falling back to legacy files.
 */

export type BinauralCategory = "delta" | "theta" | "alpha" | "beta" | "gamma";
export type BackgroundSound = "none" | "rain" | "brown" | "ocean" | "forest" | "wind" | "fire" | "thunder";

/**
 * Optimized binaural beat file mappings (3-minute AAC loops)
 * These are the preferred files for production use.
 * 
 * File naming convention: {category}_{hz}_{base}_3min.m4a
 * Example: delta_4hz_400_3min.m4a
 */
export const optimizedBinauralBeatFiles: Record<BinauralCategory, string[]> = {
  delta: [
    "delta_1hz_100_3min.m4a",
    "delta_2hz_120_3min.m4a",
    "delta_4hz_400_3min.m4a",
  ],
  theta: [
    "theta_4hz_400_3min.m4a",
    "theta_8hz_120_3min.m4a",
  ],
  alpha: [
    "alpha_10hz_400_3min.m4a",
    "alpha_12hz_120_3min.m4a",
  ],
  beta: [
    "beta_13hz_400_3min.m4a",
    "beta_20hz_120_3min.m4a",
  ],
  gamma: [
    "gamma_38hz_100_3min.m4a",
    "gamma_40hz_120_3min.m4a",
    "gamma_42hz_400_3min.m4a",
  ],
};

/**
 * Legacy binaural beat file names (original WAV files)
 * Used as fallback when optimized files are not available.
 */
export const legacyBinauralBeatFileNames: Record<BinauralCategory, string[]> = {
  delta: [
    "Binaural Beat - Delta@1Hz - 100Hz Base.wav",
    "Binaural Beat - Delta@2Hz - 120Hz Base.wav",
    "Binaural Beat - Delta@4Hz - 400Hz Base.wav",
  ],
  theta: [
    "Binaural Beat - Theta@4Hz - 400Hz Base.wav",
    "Binaural Beat - Theta@8Hz - 120Hz Base.wav",
  ],
  alpha: [
    "Binaural Beat - Alpha@10Hz - 400Hz Base.wav",
    "Binaural Beat - Alpha@12Hz - 120Hz Base.wav",
  ],
  beta: [
    "Binaural Beat - Beta@13Hz - 400Hz Base.wav",
    "Binaural Beat - Beta@20Hz - 120Hz Base.wav",
  ],
  gamma: [
    "Binaural Beat - Gamma@38Hz - 100Hz Base.wav",
    "Binaural Beat - Gamma@40Hz - 120Hz Base.wav",
    "Binaural Beat - Gamma@42Hz - 400Hz Base.wav",
  ],
};

/**
 * Maps binaural categories to audio file names
 * @deprecated Use optimizedBinauralBeatFiles or legacyBinauralBeatFileNames instead
 * Kept for backward compatibility
 */
export const binauralBeatFileNames: Record<BinauralCategory, string[]> = legacyBinauralBeatFileNames;

/**
 * Maps background sound preferences to audio file names
 * These files should be in assets/audio/background/ directory
 */
export const backgroundSoundFileNames: Record<BackgroundSound, string | null> = {
  none: null,
  rain: "Birds chirping during light rain.mp3",
  brown: "Peaceful Mind Music with Underwater Bubbles and Brown Noise.mp3",
  ocean: "Relaxing Walk at the Ocean (Intentional Pauses & Walking Sounds).mp3",
  forest: "15 Min Forest Rain with Birds and Babbling Brook.mp3",
  wind: "Heavy Rain with Heavy Wind and Theta Waves for Relaxation.mp3",
  fire: "Cozy Fire during a Thunderstorm with Theta Waves.mp3",
  thunder: "Peaceful Time Music with Thunder and White Noise.mp3",
};

/**
 * Get an optimized binaural beat file name for a category
 * Returns the first available optimized file (can be randomized later)
 */
export function getOptimizedBinauralBeatFileName(category: BinauralCategory): string {
  const files = optimizedBinauralBeatFiles[category];
  if (files.length === 0) {
    throw new Error(`No optimized binaural beat files found for category: ${category}`);
  }
  return files[0];
}

/**
 * Get a legacy binaural beat file name for a category
 * Returns the first available legacy file (can be randomized later)
 */
export function getLegacyBinauralBeatFileName(category: BinauralCategory): string {
  const files = legacyBinauralBeatFileNames[category];
  if (files.length === 0) {
    throw new Error(`No legacy binaural beat files found for category: ${category}`);
  }
  return files[0];
}

/**
 * Get a binaural beat file name for a category
 * Returns the first available file (can be randomized later)
 * @deprecated Use getOptimizedBinauralBeatFileName or getLegacyBinauralBeatFileName instead
 */
export function getBinauralBeatFileName(category: BinauralCategory): string {
  return getLegacyBinauralBeatFileName(category);
}

/**
 * Get background sound file name
 */
export function getBackgroundSoundFileName(sound: BackgroundSound): string | null {
  return backgroundSoundFileNames[sound];
}

/**
 * Get URL for an optimized binaural beat file (served from backend)
 * Uses the optimized 3-minute AAC file name
 */
export function getOptimizedBinauralBeatUrl(category: BinauralCategory, backendUrl: string): string {
  const fileName = getOptimizedBinauralBeatFileName(category);
  return `${backendUrl}/api/audio/binaural/${encodeURIComponent(fileName)}`;
}

/**
 * Get URL for a legacy binaural beat file (served from backend)
 * Uses the original WAV file name
 */
export function getLegacyBinauralBeatUrl(category: BinauralCategory, backendUrl: string): string {
  const fileName = getLegacyBinauralBeatFileName(category);
  return `${backendUrl}/api/audio/binaural/${encodeURIComponent(fileName)}`;
}

/**
 * Get URL for a binaural beat file (served from backend)
 * Prefers optimized files, falls back to legacy files
 */
export function getBinauralBeatUrl(category: BinauralCategory, backendUrl: string, useOptimized: boolean = true): string {
  if (useOptimized) {
    try {
      return getOptimizedBinauralBeatUrl(category, backendUrl);
    } catch (error) {
      // Fall back to legacy if optimized files are not available
      console.warn(`Optimized binaural beat file not found for ${category}, falling back to legacy`);
      return getLegacyBinauralBeatUrl(category, backendUrl);
    }
  }
  return getLegacyBinauralBeatUrl(category, backendUrl);
}

/**
 * Get URL for a background sound file (served from backend)
 */
export function getBackgroundSoundUrl(sound: BackgroundSound, backendUrl: string): string | null {
  const fileName = getBackgroundSoundFileName(sound);
  if (!fileName) return null;
  return `${backendUrl}/api/audio/background/${encodeURIComponent(fileName)}`;
}

