import "@testing-library/jest-native/extend-expect";

// Mock expo-av (audio library)
jest.mock("expo-av", () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: { playAsync: jest.fn(), pauseAsync: jest.fn(), unloadAsync: jest.fn() },
        status: { isLoaded: true },
      }),
    },
    setAudioModeAsync: jest.fn(),
  },
}));

// Mock in-app purchases basic methods
jest.mock("expo-in-app-purchases", () => ({
  connectAsync: jest.fn().mockResolvedValue(true),
  disconnectAsync: jest.fn().mockResolvedValue(undefined),
  getProductsAsync: jest.fn().mockResolvedValue({ results: [] }),
  purchaseItemAsync: jest.fn().mockResolvedValue({}),
  getPurchaseHistoryAsync: jest.fn().mockResolvedValue({ results: [] }),
  setPurchaseListener: jest.fn(),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));


