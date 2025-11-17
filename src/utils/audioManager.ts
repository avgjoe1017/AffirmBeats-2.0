/**
 * Audio Manager for multi-track playback
 * 
 * Manages three audio layers:
 * 1. Affirmations (TTS from backend)
 * 2. Binaural Beats (local audio files)
 * 3. Background Noise (local audio files)
 * 
 * Uses expo-av for audio playback (compatible with current setup)
 */

import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { BACKEND_URL } from "@/lib/api";

// Type assertions for expo-file-system API compatibility
const cacheDirectory = (FileSystemLegacy as any).cacheDirectory as string;

export interface AudioManagerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

/**
 * Audio Manager Hook
 * Manages multi-track audio playback with independent volume control
 */
export function useAudioManager() {
  const [affirmationsSound, setAffirmationsSound] = useState<Audio.Sound | null>(null);
  const [binauralSound, setBinauralSound] = useState<Audio.Sound | null>(null);
  const [backgroundSound, setBackgroundSound] = useState<Audio.Sound | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Playlist state
  const [playlist, setPlaylist] = useState<Array<{
    id: string;
    text: string;
    audioUrl: string | null;
    durationMs: number;
    silenceAfterMs: number;
  }>>([]);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const playlistSoundsRef = useRef<Map<string, Audio.Sound>>(new Map());

  const affirmationsVolumeRef = useRef(100);
  const binauralVolumeRef = useRef(70);
  const backgroundVolumeRef = useRef(50);
  const backgroundPanRef = useRef(0); // Pan value: -1 (left) to 1 (right), 0 = center

  /**
   * Load affirmation playlist from session
   * NEW: Uses individual affirmation audio files
   */
  const loadAffirmationPlaylist = async (sessionId: string) => {
    try {
      // Clean up existing sounds
      playlistSoundsRef.current.forEach((sound) => {
        sound.unloadAsync().catch(console.error);
      });
      playlistSoundsRef.current.clear();
      
      if (affirmationsSound) {
        await affirmationsSound.unloadAsync();
        setAffirmationsSound(null);
      }

      // Fetch playlist from backend
      const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/playlist`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch playlist: ${response.status}`);
      }

      const playlistData = await response.json();
      
      if (!playlistData.affirmations || playlistData.affirmations.length === 0) {
        throw new Error("Playlist is empty");
      }

      // Set playlist and calculate total duration
      setPlaylist(playlistData.affirmations);
      setDuration(playlistData.totalDurationMs / 1000);
      setCurrentAffirmationIndex(0);

      // Preload all affirmation audio files
      const loadPromises = playlistData.affirmations.map(async (aff: {
        id: string;
        audioUrl: string | null;
      }) => {
        if (!aff.audioUrl) {
          console.warn(`[AudioManager] No audio URL for affirmation ${aff.id}`);
          return;
        }

        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: aff.audioUrl },
            { shouldPlay: false }
          );
          playlistSoundsRef.current.set(aff.id, sound);
        } catch (error) {
          console.error(`[AudioManager] Failed to load affirmation ${aff.id}:`, error);
        }
      });

      await Promise.all(loadPromises);
      console.log(`[AudioManager] Loaded ${playlistSoundsRef.current.size} affirmation audio files`);
    } catch (error) {
      console.error("[AudioManager] Failed to load affirmation playlist:", error);
      throw error;
    }
  };

  /**
   * Load affirmations audio from TTS endpoint (LEGACY - for backward compatibility)
   * @deprecated Use loadAffirmationPlaylist instead
   */
  const loadAffirmations = async (
    affirmations: string[],
    voiceType: "neutral" | "confident" | "whisper",
    pace: "slow" | "normal",
    affirmationSpacing?: number, // Seconds between affirmations
    goal?: "sleep" | "focus" | "calm" | "manifest" // Goal for voice configuration
  ) => {
    try {
      // Clean up existing sound
      if (affirmationsSound) {
        await affirmationsSound.unloadAsync();
      }

      const response = await fetch(`${BACKEND_URL}/api/tts/generate-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          affirmations,
          voiceType,
          pace,
          affirmationSpacing,
          goal, // Include goal for goal-based voice configuration
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      // Get audio data from response as array buffer
      // React Native fetch returns ArrayBuffer, not Blob
      const audioArrayBuffer = await response.arrayBuffer();
      
      // Save to temporary file using expo-file-system
      const tempFileUri = `${cacheDirectory}tts_${Date.now()}.mp3`;
      
      // Convert ArrayBuffer to base64 for FileSystem
      // Simple base64 encoding function for React Native
      const uint8Array = new Uint8Array(audioArrayBuffer);
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let base64String = '';
      let i = 0;
      while (i < uint8Array.length) {
        const a = uint8Array[i++];
        const b = i < uint8Array.length ? uint8Array[i++] : 0;
        const c = i < uint8Array.length ? uint8Array[i++] : 0;
        const bitmap = (a << 16) | (b << 8) | c;
        base64String += base64Chars.charAt((bitmap >> 18) & 63);
        base64String += base64Chars.charAt((bitmap >> 12) & 63);
        base64String += i - 2 < uint8Array.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
        base64String += i - 1 < uint8Array.length ? base64Chars.charAt(bitmap & 63) : '=';
      }
      
      await FileSystemLegacy.writeAsStringAsync(
        tempFileUri,
        base64String,
        { encoding: "base64" as const }
      );

      // Create audio from file URI
      // Affirmations should loop continuously
      const { sound } = await Audio.Sound.createAsync(
        { uri: tempFileUri },
        { shouldPlay: false, isLooping: true }
      );

      // Get status to set duration
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      }

      // Set up status update listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          // For looping audio, track position within the loop
          // Reset to 0 when it loops (didJustFinish fires on each loop)
          if (status.didJustFinish) {
            // Affirmations looped - reset time to 0 for display
            setCurrentTime(0);
          } else {
            setCurrentTime(status.positionMillis ? status.positionMillis / 1000 : 0);
          }
        }
      });

      setAffirmationsSound(sound);
      return sound;
    } catch (error) {
      console.error("[AudioManager] Failed to load affirmations:", error);
      throw error;
    }
  };

  /**
   * Load binaural beats audio file
   * @param fileUri - URI to the audio file (can be local asset or remote URL)
   */
  const loadBinauralBeats = async (fileUri: string) => {
    try {
      // Clean up existing sound
      if (binauralSound) {
        await binauralSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: false, isLooping: true, volume: 0 } // Start at volume 0 for fade-in
      );

      setBinauralSound(sound);
      return sound;
    } catch (error) {
      console.error("[AudioManager] Failed to load binaural beats:", error);
      throw error;
    }
  };

  /**
   * Load background noise audio file
   */
  const loadBackgroundNoise = async (fileUri: string | null) => {
    if (!fileUri) {
      if (backgroundSound) {
        await backgroundSound.unloadAsync();
      }
      setBackgroundSound(null);
      return null;
    }

    try {
      // Clean up existing sound
      if (backgroundSound) {
        await backgroundSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: false, isLooping: true, volume: 0 } // Start at volume 0 for fade-in
      );

      setBackgroundSound(sound);
      return sound;
    } catch (error) {
      console.error("[AudioManager] Failed to load background noise:", error, { fileUri });
      // Don't throw - allow playback to continue without background sound
      console.warn("[AudioManager] Continuing without background noise - URL may be invalid or file missing");
      return null;
    }
  };

  /**
   * Set volume for affirmations (0-100)
   */
  const setAffirmationsVolume = async (volume: number) => {
    affirmationsVolumeRef.current = volume;
    if (affirmationsSound) {
      await affirmationsSound.setVolumeAsync(volume / 100);
    }
  };

  /**
   * Set volume for binaural beats (0-100)
   */
  const setBinauralBeatsVolume = async (volume: number) => {
    binauralVolumeRef.current = volume;
    if (binauralSound) {
      await binauralSound.setVolumeAsync(volume / 100);
    }
  };

  /**
   * Set volume for background noise (0-100)
   */
  const setBackgroundNoiseVolume = async (volume: number) => {
    backgroundVolumeRef.current = volume;
    if (backgroundSound) {
      await backgroundSound.setVolumeAsync(volume / 100);
    }
  };

  /**
   * Set pan for background noise (-1 to 1, where -1 = left, 0 = center, 1 = right)
   * 
   * NOTE: expo-av doesn't support panning natively.
   * This function is prepared for future migration to expo-audio or react-native-audio-api.
   * For now, it stores the pan value but doesn't apply it to the audio.
   * 
   * To enable full panning support:
   * 1. Migrate background audio to expo-audio (supports panning via StereoPannerNode)
   * 2. Or use react-native-audio-api for Web Audio API support
   * 
   * @param pan - Pan value from -1 (left) to 1 (right), 0 = center
   */
  const setBackgroundNoisePan = async (pan: number) => {
    // Clamp pan value to valid range
    const clampedPan = Math.max(-1, Math.min(1, pan));
    backgroundPanRef.current = clampedPan;
    
    // TODO: Apply panning when using expo-audio or react-native-audio-api
    // For expo-av, panning is not supported, so this is a no-op
    // When migrating to expo-audio, use:
    // backgroundSound.setPanAsync(clampedPan);
    
    if (backgroundSound) {
      // expo-av doesn't support panning, so we can't apply it
      // This is a placeholder for future implementation
      console.log(`[AudioManager] Pan value set to ${clampedPan} (not applied - expo-av doesn't support panning)`);
    }
  };

  /**
   * Play next affirmation in playlist
   */
  const playNextAffirmation = async (index: number) => {
    if (index >= playlist.length) {
      // Playlist complete
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    const affirmation = playlist[index];
    setCurrentAffirmationIndex(index);

    if (!affirmation.audioUrl) {
      console.warn(`[AudioManager] No audio URL for affirmation at index ${index}, skipping`);
      // Skip to next after silence
      setTimeout(() => {
        playNextAffirmation(index + 1);
      }, affirmation.silenceAfterMs);
      return;
    }

    const sound = playlistSoundsRef.current.get(affirmation.id);
    if (!sound) {
      console.warn(`[AudioManager] Sound not loaded for affirmation ${affirmation.id}, skipping`);
      setTimeout(() => {
        playNextAffirmation(index + 1);
      }, affirmation.silenceAfterMs);
      return;
    }

    try {
      // Set volume
      await sound.setVolumeAsync(affirmationsVolumeRef.current / 100);
      
      // Play the affirmation
      await sound.playAsync();
      
      // Track playback progress
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          const elapsed = status.positionMillis ? status.positionMillis / 1000 : 0;
          // Calculate total time: sum of all previous affirmations + current position
          let totalTime = 0;
          for (let i = 0; i < index; i++) {
            totalTime += (playlist[i].durationMs / 1000) + (playlist[i].silenceAfterMs / 1000);
          }
          totalTime += elapsed;
          setCurrentTime(totalTime);
          
          // When this affirmation finishes, wait for silence then play next
          if (status.didJustFinish) {
            setTimeout(() => {
              playNextAffirmation(index + 1);
            }, affirmation.silenceAfterMs);
          }
        }
      });
    } catch (error) {
      console.error(`[AudioManager] Failed to play affirmation ${index}:`, error);
      // Continue to next
      setTimeout(() => {
        playNextAffirmation(index + 1);
      }, affirmation.silenceAfterMs);
    }
  };

  /**
   * Play all tracks with fade-in timing:
   * - Binaural beats and background: start at volume 0, fade in over 3 seconds
   * - Wait 2 more seconds (total 5 seconds)
   * - Then start affirmations playlist
   */
  const play = async () => {
    try {
      const FADE_IN_DURATION = 3000; // 3 seconds in milliseconds
      const AFFIRMATION_DELAY = 5000; // 5 seconds total (3s fade + 2s wait)
      
      // Start binaural beats and background at volume 0, then fade in
      if (binauralSound) {
        await binauralSound.setVolumeAsync(0);
        await binauralSound.playAsync();
        // Fade in over 3 seconds
        binauralSound.setVolumeAsync(binauralVolumeRef.current / 100, { duration: FADE_IN_DURATION });
      }
      
      if (backgroundSound) {
        await backgroundSound.setVolumeAsync(0);
        await backgroundSound.playAsync();
        // Fade in over 3 seconds
        backgroundSound.setVolumeAsync(backgroundVolumeRef.current / 100, { duration: FADE_IN_DURATION });
      }
      
      // Wait 2 more seconds (total 5 seconds from start), then start affirmations
      setTimeout(async () => {
        if (playlist.length > 0) {
          // Use new playlist system
          setIsPlaying(true);
          await playNextAffirmation(0);
        } else if (affirmationsSound) {
          // Fallback to legacy single-file system
          await affirmationsSound.playAsync();
          setIsPlaying(true);
        }
      }, AFFIRMATION_DELAY);
    } catch (error) {
      console.error("[AudioManager] Failed to play:", error);
    }
  };

  /**
   * Pause all tracks
   */
  const pause = async () => {
    try {
      // Pause current affirmation
      const currentAffirmation = playlist[currentAffirmationIndex];
      if (currentAffirmation) {
        const sound = playlistSoundsRef.current.get(currentAffirmation.id);
        if (sound) {
          await sound.pauseAsync();
        }
      }
      
      // Legacy support
      if (affirmationsSound) {
        await affirmationsSound.pauseAsync();
      }
      
      if (binauralSound) {
        await binauralSound.pauseAsync();
      }
      if (backgroundSound) {
        await backgroundSound.pauseAsync();
      }
      setIsPlaying(false);
    } catch (error) {
      console.error("[AudioManager] Failed to pause:", error);
    }
  };

  /**
   * Seek to position (in seconds)
   */
  const seek = async (time: number) => {
    try {
      if (affirmationsSound) {
        await affirmationsSound.setPositionAsync(time * 1000);
      }
      // Note: Binaural and background typically don't need seeking as they loop
      setCurrentTime(time);
    } catch (error) {
      console.error("[AudioManager] Failed to seek:", error);
    }
  };

  /**
   * Cleanup all players
   */
  const cleanup = async () => {
    try {
      if (affirmationsSound) {
        await affirmationsSound.unloadAsync();
      }
      if (binauralSound) {
        await binauralSound.unloadAsync();
      }
      if (backgroundSound) {
        await backgroundSound.unloadAsync();
      }
    } catch (error) {
      console.error("[AudioManager] Error during cleanup:", error);
    }
    setAffirmationsSound(null);
    setBinauralSound(null);
    setBackgroundSound(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  // Apply volume changes when sounds are loaded
  // Note: Binaural and background start at volume 0 for fade-in, so don't override here
  useEffect(() => {
    if (affirmationsSound) {
      affirmationsSound.setVolumeAsync(affirmationsVolumeRef.current / 100);
    }
  }, [affirmationsSound]);

  // Don't auto-set volume for binaural/background - they start at 0 for fade-in
  // Volume will be set during play() with fade-in animation

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Note: cleanup is async but we can't await in cleanup function
      // This is acceptable as cleanup will still execute
      cleanup().catch((error) => {
        console.error("[AudioManager] Error in cleanup:", error);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // State
    isPlaying,
    currentTime,
    duration,
    
    // Loadin