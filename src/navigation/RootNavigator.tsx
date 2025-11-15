import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Home, Library, Settings } from "lucide-react-native";

import type { BottomTabParamList, RootStackParamList } from "@/navigation/types";
import OnboardingScreen from "@/screens/OnboardingScreen";
import HomeScreen from "@/screens/HomeScreen";
import LibraryScreen from "@/screens/LibraryScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import GenerationScreen from "@/screens/GenerationScreen";
import PlaybackScreen from "@/screens/PlaybackScreen";
import LoginModalScreen from "@/screens/LoginModalScreen";
import CreateSessionScreen from "@/screens/CreateSessionScreen";
import SubscriptionScreen from "@/screens/SubscriptionScreen";
import MiniPlayer from "@/components/MiniPlayer";
import CinematicOpener from "@/components/CinematicOpener";
import { api } from "@/lib/api";
import { useAppStore } from "@/state/appStore";
import type { GetSubscriptionResponse } from "@/shared/contracts";

/**
 * RootStackNavigator
 * The root navigator for Affirmation Beats
 * Contains onboarding, main tabs, generation flow, and playback
 */
const RootStack = createNativeStackNavigator<RootStackParamList>();
const RootNavigator = () => {
  const [showOpener, setShowOpener] = React.useState(true);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  // Show cinematic opener only on cold start
  if (showOpener) {
    return <CinematicOpener onComplete={() => setShowOpener(false)} />;
  }

  return (
    <RootStack.Navigator initialRouteName={hasCompletedOnboarding ? "Tabs" : "Onboarding"}>
      <RootStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="Tabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="Generation"
        component={GenerationScreen}
        options={{
          headerShown: false,
          presentation: "card",
          animation: "fade", // Standardized: fade animation (150-250ms)
        }}
      />
      <RootStack.Screen
        name="Playback"
        component={PlaybackScreen}
        options={{
          headerShown: false,
          presentation: "card",
          animation: "fade", // Standardized: fade animation (150-250ms)
        }}
      />
      <RootStack.Screen
        name="CreateSession"
        component={CreateSessionScreen}
        options={{
          headerShown: false,
          presentation: "card",
          animation: "fade", // Standardized: fade animation (150-250ms)
        }}
      />
      <RootStack.Screen
        name="LoginModalScreen"
        component={LoginModalScreen}
        options={{
          presentation: "modal",
          title: "Login",
          animation: "fade", // Standardized: fade animation (150-250ms)
        }}
      />
      <RootStack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          headerShown: false,
          presentation: "card",
          animation: "fade", // Standardized: fade animation (150-250ms)
        }}
      />
    </RootStack.Navigator>
  );
};

/**
 * BottomTabNavigator
 * Main app tabs: Home, Library, Settings
 */
const BottomTab = createBottomTabNavigator<BottomTabParamList>();
const BottomTabNavigator = () => {
  const setSubscription = useAppStore((s) => s.setSubscription);

  // Fetch subscription data on mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await api.get<GetSubscriptionResponse>("/api/subscription");
        setSubscription(data);
      } catch (error) {
        console.log("Failed to fetch subscription:", error);
      }
    };

    fetchSubscription();
  }, [setSubscription]);

  return (
    <View style={{ flex: 1 }}>
      <BottomTab.Navigator
        initialRouteName="HomeTab"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "rgba(15, 15, 30, 0.9)",
            borderTopWidth: 1,
            borderTopColor: "rgba(139, 122, 184, 0.2)",
          },
          tabBarActiveTintColor: "#8B7AB8",
          tabBarInactiveTintColor: "#666",
          tabBarBackground: () => (
            <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
          ),
        }}
        screenListeners={() => ({
          transitionStart: () => {
            Haptics.selectionAsync();
          },
        })}
      >
        <BottomTab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <BottomTab.Screen
          name="LibraryTab"
          component={LibraryScreen}
          options={{
            title: "Library",
            tabBarIcon: ({ color, size }) => <Library size={size} color={color} />,
          }}
        />
        <BottomTab.Screen
          name="SettingsTab"
          component={SettingsScreen}
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          }}
        />
      </BottomTab.Navigator>

      {/* Mini Player - Shows above tab bar when a session is playing */}
      <MiniPlayer />
    </View>
  );
};

export default RootNavigator;
