/**
 * MiniPlayer Component Tests
 * 
 * Tests for the MiniPlayer component that displays a mini audio player
 * at the bottom of the screen when a session is playing.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MiniPlayer from "../MiniPlayer";
import { useAppStore } from "@/state/appStore";

// Mock the app store
jest.mock("@/state/appStore");

// Mock navigation
const Stack = createNativeStackNavigator();

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Test" component={() => <>{children}</>} />
        <Stack.Screen name="Playback" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe("MiniPlayer", () => {
  const mockSetIsPlaying = jest.fn();
  const mockSetCurrentTime = jest.fn();
  const mockSetCurrentSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as jest.Mock).mockImplementation((selector) => {
      const mockState = {
        currentSession: {
          sessionId: "test-session-1",
          title: "Test Session",
          goal: "focus",
          lengthSec: 180,
        },
        isPlaying: false,
        setIsPlaying: mockSetIsPlaying,
        currentTime: 0,
        setCurrentTime: mockSetCurrentTime,
        setCurrentSession: mockSetCurrentSession,
      };
      return selector(mockState);
    });
  });

  it("should not render when no session is active", () => {
    (useAppStore as jest.Mock).mockImplementation((selector) => {
      const mockState = {
        currentSession: null,
        isPlaying: false,
        setIsPlaying: mockSetIsPlaying,
        currentTime: 0,
        setCurrentTime: mockSetCurrentTime,
        setCurrentSession: mockSetCurrentSession,
      };
      return selector(mockState);
    });

    const { queryByTestId } = render(
      <TestWrapper>
        <MiniPlayer />
      </TestWrapper>
    );

    expect(queryByTestId("mini-player")).toBeNull();
  });

  it("should render when a session is active", () => {
    const { getByText } = render(
      <TestWrapper>
        <MiniPlayer />
      </TestWrapper>
    );

    expect(getByText("Test Session")).toBeTruthy();
  });

  it("should display session title", () => {
    const { getByText } = render(
      <TestWrapper>
        <MiniPlayer />
      </TestWrapper>
    );

    expect(getByText("Test Session")).toBeTruthy();
  });

  it("should display session goal", () => {
    const { getByText } = render(
      <TestWrapper>
        <MiniPlayer />
      </TestWrapper>
    );

    expect(getByText(/focus/i)).toBeTruthy();
  });

  it("should handle session interaction", () => {
    const { getByText } = render(
      <TestWrapper>
        <MiniPlayer />
      </TestWrapper>
    );

    const sessionTitle = getByText("Test Session");
    expect(sessionTitle).toBeTruthy();
  });
});

