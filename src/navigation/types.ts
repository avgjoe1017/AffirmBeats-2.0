import type { BottomTabScreenProps as BottomTabScreenPropsBase } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<BottomTabParamList> | undefined;
  Generation: { goal: "sleep" | "focus" | "calm" | "manifest"; customPrompt?: string };
  Playback: { sessionId: string };
  LoginModalScreen: undefined;
  CreateSession: { sessionId?: string }; // Optional sessionId for editing
  Subscription: undefined;
};

export type BottomTabParamList = {
  HomeTab: undefined;
  LibraryTab: undefined;
  SettingsTab: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type BottomTabScreenProps<Screen extends keyof BottomTabParamList> = CompositeScreenProps<
  BottomTabScreenPropsBase<BottomTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;
