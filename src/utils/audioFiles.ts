/**
 * Audio file mappings for binaural beats and background sounds
 * 
 * Maps user preferences to actual audio file paths.
 * 
 * NOTE: Audio files need to be copied to assets/audio/ directory for React Native to access them.
 * The files are currently in "raw audio files" folder and need to be moved/copied.
 * 
 * Alternatively, files can be served from the backend and accessed via URL.
 */

export type BinauralCategory = "delta" | "theta" | "alpha" | "beta" | "gamma";
export type BackgroundSound = "none" | "rain" | "brown" | "ocean" | "forest" | "wind" | "fire" | "thunder";

/**
 * Maps binaural categories to audio file names
 * These files should be in assets/audio/binaural/ directory
 */
export const binauralBeatFileNames: Record<BinauralCategory, string[]> = {
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
 * Get a binaural beat file name for a category
 * Returns the first available file (can be randomized later)
 */
export function getBinauralBeatFileName(category: BinauralCategory): string {
  const files = binauralBeatFileNames[category];
  if (files.length === 0) {
    throw new Error(`No binaural beat files found for category: ${category}`);
  }
  return files[0];
}

/**
 * Get background sound file name
 */
export function getBackgroundSoundFileName(sound: BackgroundSound): string | null {
  return backgroundSoundFileNames[sound];
}

/**
 * Get URL for a binaural beat file (served from backend)
 */
export function getBinauralBeatUrl(category: BinauralCategory, backendUrl: string): string {
  const fileName = getBinauralBeatFileName(category);
  return `${backendUrl}/api/audio/binaural/${encodeURIComponent(fileName)}`;
}

/**
 * Get URL for a background sound file (served from backend)
 */
export function getBackgroundSoundUrl(sound: BackgroundSound, backendUrl: string): string | null {
  const fileName = getBackgroundSoundFileName(sound);
  if (!fileName) return null;
  return `${backendUrl}/api/audio/background/${encodeURIComponent(fileName)}`;
}

