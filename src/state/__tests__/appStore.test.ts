/**
 * App Store Tests
 * 
 * Tests for the Zustand app store that manages global application state.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useAppStore } from "../appStore";

describe("AppStore", () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useAppStore.getState();
    store.setPreferences({
      voice: "neutral",
      pace: "normal",
      noise: "rain",
      pronounStyle: "you",
      intensity: "gentle",
      duration: 180,
      affirmationSpacing: 8,
    });
    store.setSessions([]);
    store.setCurrentSession(null);
    store.setIsPlaying(false);
    store.setCurrentTime(0);
  });

  describe("Preferences", () => {
    it("should set preferences", () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setPreferences({
          voice: "confident",
          pace: "slow",
          noise: "brown",
          pronounStyle: "i",
          intensity: "assertive",
          duration: 300,
          affirmationSpacing: 10,
        });
      });

      expect(result.current.preferences.voice).toBe("confident");
      expect(result.current.preferences.pace).toBe("slow");
      expect(result.current.preferences.noise).toBe("brown");
    });
  });

  describe("Sessions", () => {
    it("should add a session", () => {
      const { result } = renderHook(() => useAppStore());

      const newSession = {
        id: "session-1",
        title: "Test Session",
        goal: "focus" as const,
        affirmations: ["I am focused"],
        voiceId: "neutral",
        pace: "normal",
        noise: "rain",
        lengthSec: 180,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addSession(newSession);
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].id).toBe("session-1");
    });

    it("should update a session", () => {
      const { result } = renderHook(() => useAppStore());

      const session = {
        id: "session-1",
        title: "Test Session",
        goal: "focus" as const,
        affirmations: ["I am focused"],
        voiceId: "neutral",
        pace: "normal",
        noise: "rain",
        lengthSec: 180,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addSession(session);
        result.current.updateSession("session-1", { title: "Updated Session" });
      });

      expect(result.current.sessions[0].title).toBe("Updated Session");
    });

    it("should remove a session", () => {
      const { result } = renderHook(() => useAppStore());

      const session = {
        id: "session-1",
        title: "Test Session",
        goal: "focus" as const,
        affirmations: ["I am focused"],
        voiceId: "neutral",
        pace: "normal",
        noise: "rain",
        lengthSec: 180,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addSession(session);
        result.current.removeSession("session-1");
      });

      expect(result.current.sessions).toHaveLength(0);
    });
  });

  describe("Playback", () => {
    it("should set playing state", () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setIsPlaying(true);
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it("should set current time", () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setCurrentTime(90);
      });

      expect(result.current.currentTime).toBe(90);
    });
  });

  describe("Audio Mixer", () => {
    it("should set audio mixer volumes", () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAudioMixerVolumes({
          affirmations: 80,
          binauralBeats: 60,
          backgroundNoise: 40,
        });
      });

      expect(result.current.audioMixerVolumes.affirmations).toBe(80);
      expect(result.current.audioMixerVolumes.binauralBeats).toBe(60);
      expect(result.current.audioMixerVolumes.backgroundNoise).toBe(40);
    });

    it("should set individual volumes", () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAffirmationsVolume(75);
      });

      expect(result.current.audioMixerVolumes.affirmations).toBe(75);
    });
  });
});

