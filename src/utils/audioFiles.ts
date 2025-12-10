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
 * Maps background sound preferences to optimized audio files
 * These are loopable M4A files in assets/audio/background/looped/
 * Format: { subdirectory: filename }
 */
export const optimizedBackgroundSoundFiles: Record<BackgroundSound, Array<{ subdirectory: string; filename: string; isPremium?: boolean }> | null> = {
  none: null,
  rain: [
    { subdirectory: "looped", filename: "Heavy Rain.m4a", isPremium: false }, // FREE
    { subdirectory: "looped", filename: "Forest Rain.m4a", isPremium: true }, // PREMIUM
  ],
  brown: [
    { subdirectory: "looped", filename: "Regeneration.m4a", isPremium: true },
    { subdirectory: "looped", filename: "Tibetan Om.m4a", isPremium: true },
  ],
  ocean: [
    { subdirectory: "looped", filename: "Distant Ocean.m4a", isPremium: true },
  ],
  forest: [
    { subdirectory: "looped", filename: "Forest Rain.m4a", isPremium: true },
    { subdirectory: "looped", filename: "Babbling Brook.m4a", isPremium: true },
    { subdirectory: "looped", filename: "Birds Chirping.m4a", isPremium: false }, // FREE
  ],
  wind: [
    { subdirectory: "looped", filename: "Storm.m4a", isPremium: true },
  ],
  fire: [
    { subdirectory: "looped", filename: "Regeneration.m4a", isPremium: true },
    { subdirectory: "looped", filename: "Tibetan Om.m4a", isPremium: true },
  ],
  thunder: [
    { subdirectory: "looped", filename: "Thunder.m4a", isPremium: true },
    { subdirectory: "looped", filename: "Storm.m4a", isPremium: true },
  ],
};

/**
 * Legacy background sound file names (original MP3 files)
 * Used as fallback when optimized files are not available.
 */
export const legacyBackgroundSoundFileNames: Record<BackgroundSound, string | null> = {
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
 * Maps background sound preferences to audio file names
 * @deprecated Use optimizedBackgroundSoundFiles instead
 * Kept for backward compatibility
 */
export const backgroundSoundFileNames: Record<BackgroundSound, string | null> = legacyBackgroundSoundFileNames;

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
 * Get an optimized background sound file for a preference
 * Returns a random file from available options for variety
 * Filters out premium files if user doesn't have premium access
 */
export function getOptimizedBackgroundSoundFile(
  sound: BackgroundSound,
  hasPremiumAccess: boolean = false
): { subdirectory: string; filename: string } | null {
  const files = optimizedBackgroundSoundFiles[sound];
  if (!files || files.length === 0) {
    return null;
  }
  
  // Filter to only free files if user doesn't have premium access
  const availableFiles = hasPremiumAccess 
    ? files 
    : files.filter(file => !file.isPremium);
  
  if (availableFiles.length === 0) {
    return null;
  }
  
  // Return a random file for variety (can be made deterministic if needed)
  const randomIndex = Math.floor(Math.random() * availableFiles.length);
  const selected = availableFiles[randomIndex];
  return { subdirectory: selected.subdirectory, filename: selected.filename };
}

/**
 * Get a legacy background sound file name
 * Returns the first available legacy file
 */
export function getLegacyBackgroundSoundFileName(sound: BackgroundSound): string | null {
  return legacyBackgroundSoundFileNames[sound];
}

/**
 * Get background sound file name
 * @deprecated Use getOptimizedBackgroundSoundFile or getLegacyBackgroundSoundFileName instead
 */
export function getBackgroundSoundFileName(sound: BackgroundSound): string | null {
  return legacyBackgroundSoundFileNames[sound];
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
 * Only uses optimized files - no legacy .wav files available
 */
export function getBinauralBeatUrl(category: BinauralCategory, backendUrl: string, useOptimized: boolean = true): string {
  // Always use optimized files - legacy .wav files are not available
  return getOptimizedBinauralBeatUrl(category, backendUrl);
}

/**
 * Get URL for an optimized background sound file (served from backend)
 * Uses the optimized 3-minute M4A file with subdirectory path
 * Filters out premium files if user doesn't have premium access
 */
export function getOptimizedBackgroundSoundUrl(
  sound: BackgroundSound, 
  backendUrl: string,
  hasPremiumAccess: boolean = false
): string | null {
  const file = getOptimizedBackgroundSoundFile(sound, hasPremiumAccess);
  if (!file) {
    console.warn(`[audioFiles] No file available for background sound: ${sound} (premium: ${hasPremiumAccess})`);
    return null;
  }
  // Include subdirectory in the path
  const url = `${backendUrl}/api/audio/background/${encodeURIComponent(file.subdirectory)}/${encodeURIComponent(file.filename)}`;
  console.log(`[audioFiles] Generated background sound URL:`, { sound, file, url, hasPremiumAccess });
  return url;
}

/**
 * Get URL for a legacy background sound file (served from backend)
 * Uses the original MP3 file name
 */
export function getLegacyBackgroundSoundUrl(sound: BackgroundSound, backendUrl: string): string | null {
  const fileName = getLegacyBackgroundSoundFileName(sound);
  if (!fileName) return null;
  return `${backendUrl}/api/audio/background/${encodeURIComponent(fileName)}`;
}

/**
 * Get URL for a background sound file (served from backend)
 * Only uses optimized files - no legacy .mp3 files available
 * Filters out premium files if user doesn't have premium access
 */
export function getBackgroundSoundUrl(
  sound: BackgroundSound, 
  backendUrl: string, 
  useOptimized: boolean = true,
  hasPremiumAccess: boolean = false
): string | null {
  // Always use optimized files - legacy .mp3 files are not available
  return getOptimizedBackgroundSoundUrl(sound, backendUrl, hasPremiumAccess);
}

