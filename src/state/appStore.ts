import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  GetPreferencesResponse,
  GenerateSessionResponse,
  GetSessionsResponse,
  GetSubscriptionResponse,
} from "@/shared/contracts";

type Session = GetSessionsResponse["sessions"][0];

interface AppState {
  // User preferences
  preferences: GetPreferencesResponse & { duration: number; affirmationSpacing: number };
  setPreferences: (prefs: GetPreferencesResponse & { duration: number; affirmationSpacing: number }) => void;

  // Subscription status
  subscription: GetSubscriptionResponse | null;
  setSubscription: (subscription: GetSubscriptionResponse | null) => void;

  // Current session being played/generated
  currentSession: GenerateSessionResponse | null;
  setCurrentSession: (session: GenerateSessionResponse | null) => void;

  // Library of saved sessions
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  removeSession: (id: string) => void;

  // Playback state
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;

  // Audio mixer volumes (0-100)
  audioMixerVolumes: {
    affirmations: number;
    binauralBeats: number;
    backgroundNoise: number;
  };
  setAudioMixerVolumes: (volumes: { affirmations: number; binauralBeats: number; backgroundNoise: number }) => void;
  setAffirmationsVolume: (volume: number) => void;
  setBinauralBeatsVolume: (volume: number) => void;
  setBackgroundNoiseVolume: (volume: number) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;

  // Usage Tracking (for Day 3 Conversion)
  uniqueDaysUsed: string[]; // Array of date strings (YYYY-MM-DD)
  addUsageDay: (date: string) => void;
  hasSeenDay3Banner: boolean;
  setHasSeenDay3Banner: (seen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Preferences with defaults
      preferences: {
        voice: "neutral",
        pace: "normal",
        noise: "rain",
        pronounStyle: "you",
        intensity: "gentle",
        duration: 180, // 3 minutes in seconds
        affirmationSpacing: 8, // 8 seconds between affirmations
      },
      setPreferences: (prefs) => set({ preferences: prefs }),

      // Subscription status
      subscription: null,
      setSubscription: (subscription) => set({ subscription }),

      // Current session
      currentSession: null,
      setCurrentSession: (session) => set({ currentSession: session }),

      // Sessions library
      sessions: [],
      setSessions: (sessions) => set({ sessions }),
      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
        })),
      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),

      // Playback
      isPlaying: false,
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      currentTime: 0,
      setCurrentTime: (time) => set({ currentTime: time }),

      // Audio mixer volumes
      audioMixerVolumes: {
        affirmations: 100,
        binauralBeats: 70,
        backgroundNoise: 50,
      },
      setAudioMixerVolumes: (volumes) => set({ audioMixerVolumes: volumes }),
      setAffirmationsVolume: (volume) =>
        set((state) => ({
          audioMixerVolumes: { ...state.audioMixerVolumes, affirmations: volume },
        })),
      setBinauralBeatsVolume: (volume) =>
        set((state) => ({
          audioMixerVolumes: { ...state.audioMixerVolumes, binauralBeats: volume },
        })),
      setBackgroundNoiseVolume: (volume) =>
        set((state) => ({
          audioMixerVolumes: { ...state.audioMixerVolumes, backgroundNoise: volume },
        })),

      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      userName: "",
      setUserName: (name) => set({ userName: name }),

      // Usage Tracking (for Day 3 Conversion)
      uniqueDaysUsed: [],
      addUsageDay: (date) =>
        set((state) => {
          if (!state.uniqueDaysUsed.includes(date)) {
            return { uniqueDaysUsed: [...state.uniqueDaysUsed, date] };
          }
          return state;
        }),
      hasSeenDay3Banner: false,
      setHasSeenDay3Banner: (seen) => set({ hasSeenDay3Banner: seen }),
    }),
    {
      name: "affirmation-beats-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist specific keys
      partialize: (state) => ({
        preferences: state.preferences,
        sessions: state.sessions,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        userName: state.userName,
        audioMixerVolumes: state.audioMixerVolumes,
        subscription: state.subscription,
        uniqueDaysUsed: state.uniqueDaysUsed,
        hasSeenDay3Banner: state.hasSeenDay3Banner,
      }),
      // Migrate old "whisper" voice preference to "neutral"
      migrate: (persistedState: any, version: number) => {
        if (persistedState?.preferences?.voice === "whisper") {
          persistedState.preferences.voice = "neutral";
        }
        return persistedState;
      },
    }
  )
);

// Selectors for optimal re-renders
export const usePreferences = () => useAppStore((s) => s.preferences);
export const useSubscription = () => useAppStore((s) => s.subscription);
export const useCurrentSession = () => useAppStore((s) => s.currentSession);
export const useSessions = () => useAppStore((s) => s.sessions);
export const useIsPlaying = () => useAppStore((s) => s.isPlaying);
export const useCurrentTime = () => useAppStore((s) => s.currentTime);
export const useHasCompletedOnboarding = () => useAppStore((s) => s.hasCompletedOnboarding);
