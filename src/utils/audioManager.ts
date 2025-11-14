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

  const affirmationsVolumeRef = useRef(100);
  const binauralVolumeRef = useRef(70);
  const backgroundVolumeRef = useRef(50);

  /**
   * Load affirmations audio from TTS endpoint
   */
  const loadAffirmations = async (
    affirmations: string[],
    voiceType: "neutral" | "confident" | "whisper",
    pace: "slow" | "normal" | "fast",
    affirmationSpacing?: number // Seconds between affirmations
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
        { shouldPlay: false, isLooping: true }
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
        { shouldPlay: false, isLooping: true }
      );

      setBackgroundSound(sound);
      return sound;
    } catch (error) {
      console.error("[AudioManager] Failed to load background noise:", error);
      throw error;
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
   * Play all tracks
   */
  const play = async () => {
    try {
      if (affirmationsSound) {
        await affirmationsSound.playAsync();
      }
      if (binauralSound) {
        await binauralSound.playAsync();
      }
      if (backgroundSound) {
        await backgroundSound.playAsync();
      }
      setIsPlaying(true);
    } catch (error) {
      console.error("[AudioManager] Failed to play:", error);
    }
  };

  /**
   * Pause all tracks
   */
  const pause = async () => {
    try {
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
  useEffect(() => {
    if (affirmationsSound) {
      affirmationsSound.setVolumeAsync(affirmationsVolumeRef.current / 100);
    }
  }, [affirmationsSound]);

  useEffect(() => {
    if (binauralSound) {
      binauralSound.setVolumeAsync(binauralVolumeRef.current / 100);
    }
  }, [binauralSound]);

  useEffect(() => {
    if (backgroundSound) {
      backgroundSound.setVolumeAsync(backgroundVolumeRef.current / 100);
    }
  }, [backgroundSound]);

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
    
    // Loading
    loadAffirmations,
    loadBinauralBeats,
    loadBackgroundNoise,
    
    // Playback controls
    play,
    pause,
    seek,
    
    // Volume controls
    setAffirmationsVolume,
    setBinauralBeatsVolume,
    setBackgroundNoiseVolume,
    
    // Cleanup
    cleanup,
  };
}

