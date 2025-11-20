import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Sparkles, Crown, Plus, X, BookOpen } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { RootStackScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/appStore";
import { api } from "@/lib/api";
import type { CreateCustomSessionResponse, UpdateSessionResponse, GenerateSessionResponse } from "@/shared/contracts";
import AffirmationLibraryModal from "@/components/AffirmationLibraryModal";
import LockIcon from "@/components/LockIcon";
import PaywallLockModal from "@/components/PaywallLockModal";

type Props = RootStackScreenProps<"CreateSession">;

// Binaural beats categories with their frequencies
const binauralCategories = [
  { id: "delta", label: "Delta", subtitle: "Deep sleep", hz: "0.5-4", colors: ["#1A1B5E", "#6B5A98"] },
  { id: "theta", label: "Theta", subtitle: "Meditation", hz: "4-8", colors: ["#2D1B69", "#8B7AB8"] },
  { id: "alpha", label: "Alpha", subtitle: "Relaxation", hz: "8-14", colors: ["#44B09E", "#6BB6FF"] },
  { id: "beta", label: "Beta", subtitle: "Focus", hz: "14-30", colors: ["#FF9966", "#FF6B35"] },
  { id: "gamma", label: "Gamma", subtitle: "Peak performance", hz: "30-100", colors: ["#9333EA", "#F59E0B"] },
];

const CreateSessionScreen = ({ navigation, route }: Props) => {
  const { sessionId } = route.params || {};
  const sessions = useAppStore((s) => s.sessions);
  const subscription = useAppStore((s) => s.subscription);
  const userName = useAppStore((s) => s.userName);
  const existingSession = sessionId ? sessions.find((s) => s.id === sessionId) : null;

  // AI-first: User describes what they want
  const [userIntent, setUserIntent] = useState("");

  // AI-generated content (can be edited)
  const [sessionName, setSessionName] = useState(existingSession?.title || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(existingSession?.binauralCategory || null);
  const [customAffirmations, setCustomAffirmations] = useState<string[]>(
    existingSession?.affirmations && existingSession.affirmations.length > 0
      ? existingSession.affirmations
      : []
  );

  // UI state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showManualEdit, setShowManualEdit] = useState(!!existingSession);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState<string | undefined>(undefined);

  const { setCurrentSession, addSession, updateSession } = useAppStore();

  const handleGenerateWithAI = async () => {
    if (!userIntent.trim()) return;

    // Check subscription limits before generating
    if (!existingSession && subscription && !subscription.canCreateCustomSession) {
      setErrorMessage(
        `You've reached your limit of ${subscription.customSessionsLimit} custom session${subscription.customSessionsLimit > 1 ? 's' : ''} per month. Upgrade to Pro for unlimited custom sessions.`
      );
      return;
    }

    setIsGeneratingAI(true);
    setErrorMessage(null);

    try {
      // Call the existing sessions/generate endpoint with custom prompt
      const response = await api.post<GenerateSessionResponse>("/api/sessions/generate", {
        goal: "calm", // Default goal, AI will override based on prompt
        customPrompt: userIntent,
      });

      // AI has generated title, affirmations, and picked the right frequency
      setSessionName(response.title);
      setCustomAffirmations(response.affirmations);

      // Infer binaural category from the response or default to alpha
      const inferredCategory = response.binauralCategory || "alpha";
      setSelectedCategory(inferredCategory);

      setShowManualEdit(true);
    } catch (error) {
      console.error("[CreateSession] AI generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate session. Please try again.";
      setErrorMessage(errorMessage);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddAffirmation = () => {
    const maxAffirmations = subscription?.tier === "pro" ? 999 : 20;
    if (customAffirmations.length < maxAffirmations) {
      setCustomAffirmations([...customAffirmations, ""]);
    } else {
      if (subscription?.tier !== "pro") {
        setLockedFeatureName("Unlimited Affirmations");
        setShowPaywallModal(true);
      } else {
        setErrorMessage(`Maximum ${maxAffirmations} affirmations allowed per session`);
      }
    }
  };

  const handleUpdateAffirmation = (index: number, text: string) => {
    const updated = [...customAffirmations];
    updated[index] = text;
    setCustomAffirmations(updated);
  };

  const handleRemoveAffirmation = (index: number) => {
    const updated = customAffirmations.filter((_, i) => i !== index);
    setCustomAffirmations(updated);
  };

  const handleSelectFromLibrary = (affirmations: string[]) => {
    const maxAffirmations = subscription?.tier === "pro" ? 999 : 20;
    const currentCount = customAffirmations.length;
    const remainingSlots = maxAffirmations - currentCount;
    
    if (remainingSlots <= 0 && subscription?.tier !== "pro") {
      setLockedFeatureName("Unlimited Affirmations");
      setShowPaywallModal(true);
      return;
    }
    
    // Add selected affirmations, but don't exceed limit
    const toAdd = affirmations.slice(0, remainingSlots);
    setCustomAffirmations([...customAffirmations, ...toAdd]);
    if (affirmations.length > remainingSlots && subscription?.tier !== "pro") {
      setErrorMessage(`Added ${remainingSlots} affirmations. Maximum ${maxAffirmations} affirmations per session. Upgrade to Pro for unlimited affirmations.`);
    } else if (affirmations.length > remainingSlots) {
      setErrorMessage(`Added ${remainingSlots} affirmations. Maximum ${maxAffirmations} affirmations per session.`);
    }
  };

  const validAffirmations = customAffirmations.filter((a) => a.trim().length >= 3);
  const maxAffirmations = subscription?.tier === "pro" ? 999 : 20;
  const canProceed =
    sessionName.trim().length > 0 &&
    sessionName.trim().length <= 50 &&
    selectedCategory !== null &&
    validAffirmations.length > 0 &&
    validAffirmations.length <= maxAffirmations;

  const handleCreateSession = async () => {
    if (!canProceed || !selectedCategory) return;

    setIsCreating(true);
    setErrorMessage(null);

    try {
      const selectedCategoryData = binauralCategories.find((c) => c.id === selectedCategory);
      if (!selectedCategoryData) {
        setErrorMessage("Selected category not found. Please try again.");
        return;
      }

      const validAffirmations = customAffirmations.filter((a) => a.trim().length >= 3);

      // If editing an existing session
      if (existingSession && sessionId) {
        updateSession(sessionId, {
          title: sessionName,
          affirmations: validAffirmations,
          binauralCategory: selectedCategory,
          binauralHz: selectedCategoryData.hz,
        });

        if (!sessionId.startsWith("temp-")) {
          try {
            await api.patch<UpdateSessionResponse>(`/api/sessions/${sessionId}`, {
              title: sessionName,
              affirmations: validAffirmations,
              binauralCategory: selectedCategory,
              binauralHz: selectedCategoryData.hz,
            });
          } catch (error) {
            console.error("[CreateSession] Failed to update session in backend:", error);
          }
        }

        navigation.goBack();
        return;
      }

      // Creating a new session
      const response: CreateCustomSessionResponse = await api.post("/api/sessions/create", {
        title: sessionName,
        binauralCategory: selectedCategory,
        binauralHz: selectedCategoryData.hz,
        affirmations: validAffirmations,
      });

      // Add to store
      const newSession = {
        id: response.sessionId,
        title: response.title,
        goal: response.goal,
        affirmations: response.affirmations,
        voiceId: response.voiceId,
        pace: response.pace,
        noise: response.noise,
        lengthSec: response.lengthSec,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        binauralCategory: response.binauralCategory,
        binauralHz: response.binauralHz,
      };

      addSession(newSession);

      // Transform response to match GenerateSessionResponse type
      setCurrentSession({
        sessionId: response.sessionId,
        title: response.title,
        affirmations: response.affirmations,
        goal: response.goal,
        voiceId: response.voiceId,
        pace: response.pace,
        noise: response.noise,
        lengthSec: response.lengthSec,
        binauralCategory: response.binauralCategory,
        binauralHz: response.binauralHz,
      });

      // Navigate to playback
      navigation.replace("Playback", { sessionId: response.sessionId });
    } catch (error) {
      console.error("[CreateSession] Failed to create session:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create session. Please try again.";
      
      if (errorMessage.includes("limit") || errorMessage.includes("403")) {
        setErrorMessage(
          `You've reached your limit. Upgrade to Pro for unlimited custom sessions.`
        );
      } else {
        setErrorMessage(errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <LinearGradient colors={["#0F0F1E", "#1A1A2E"]} style={{ flex: 1 }}>
      {/* Header */}
      <View className="pt-14 px-6 pb-4 flex-row items-center justify-between">
        <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#F0F0F5" />
        </Pressable>
        <Text className="text-white text-xl font-bold">
          {existingSession ? "Edit Session" : "Create Session"}
        </Text>
        <View className="w-8" />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!showManualEdit ? (
          /* AI-First Input */
          <Animated.View entering={FadeIn.duration(600)}>
            <View className="mb-8">
              <Text className="text-white text-2xl font-bold mb-2">
                {userName ? `What do you want to create, ${userName}?` : "What do you want to create?"}
              </Text>
              <Text className="text-gray-400 text-base">
                Describe your intention and AI will handle the rest
              </Text>
            </View>

            <View className="mb-6">
              <TextInput
                value={userIntent}
                onChangeText={(text) => {
                  if (text.length <= 500) {
                    setUserIntent(text);
                  }
                }}
                placeholder="E.g., Help me sleep better, boost my confidence, reduce anxiety..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                className="bg-white/10 rounded-xl p-4 text-white text-base border border-white/20"
                style={{ minHeight: 120, textAlignVertical: "top" }}
                maxLength={500}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <Text className={`text-xs mt-2 text-right ${userIntent.length > 450 ? "text-red-400" : "text-gray-500"}`}>
                {userIntent.length}/500
              </Text>
            </View>

            <Pressable
              onPress={handleGenerateWithAI}
              disabled={!userIntent.trim() || isGeneratingAI}
              className="mb-4"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <LinearGradient
                colors={userIntent.trim() && !isGeneratingAI ? ["#9333EA", "#F59E0B"] : ["#333", "#444"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 20,
                  borderRadius: 16,
                  shadowColor: "#9333EA",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8
                }}
              >
                <View className="flex-row items-center justify-center">
                  {isGeneratingAI ? (
                    <>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text className="text-white text-lg font-bold ml-3" style={{ letterSpacing: 0.5 }}>
                        {userName ? `Crafting your session, ${userName}...` : "Crafting Your Session..."}
                      </Text>
                    </>
                  ) : (
                    <>
                      <View className="bg-white/20 rounded-full p-2 mr-3">
                        <Sparkles size={20} color="#FFF" fill="#FFF" />
                      </View>
                      <Text className="text-white text-lg font-bold" style={{ letterSpacing: 0.5 }}>
                        Let AI Create Magic
                      </Text>
                    </>
                  )}
                </View>
              </LinearGradient>
            </Pressable>

            {!existingSession && (
              <Pressable
                onPress={() => {
                  setShowManualEdit(true);
                  // Initialize with one empty affirmation if none exist
                  if (customAffirmations.length === 0) {
                    setCustomAffirmations([""]);
                  }
                }}
                className="active:opacity-80"
              >
                <Text className="text-purple-400 text-center text-sm">
                  Or create manually
                </Text>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          /* Manual Edit Section */
          <Animated.View entering={FadeIn.duration(600)}>
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-lg font-semibold">Session Details</Text>
                {!existingSession && (
                  <Pressable onPress={() => setShowManualEdit(false)}>
                    <Text className="text-purple-400 text-sm">Back to AI</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Session Name */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm mb-2">Session Name</Text>
              <TextInput
                value={sessionName}
                onChangeText={setSessionName}
                placeholder="My Custom Session"
                placeholderTextColor="#666"
                className="bg-white/10 rounded-xl px-4 py-3 text-white text-base border border-white/20"
                maxLength={50}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                blurOnSubmit={true}
              />
              <Text className="text-gray-500 text-xs mt-1 text-right">
                {sessionName.length}/50
              </Text>
            </View>

            {/* Binaural Category */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm mb-3">Frequency Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                <View className="flex-row gap-3">
                  {binauralCategories.map((category) => (
                    <Pressable
                      key={category.id}
                      onPress={() => setSelectedCategory(category.id)}
                      className="active:opacity-80"
                    >
                      <LinearGradient
                        colors={selectedCategory === category.id ? [category.colors[0], category.colors[1]] : ["#333", "#444"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className={`px-4 py-3 rounded-xl border-2 ${
                          selectedCategory === category.id ? "border-white/30" : "border-white/10"
                        }`}
                        style={{ minWidth: 120 }}
                      >
                        <Text className="text-white font-bold text-base">{category.label}</Text>
                        <Text className="text-white/70 text-xs mt-1">{category.subtitle}</Text>
                        <Text className="text-white/50 text-xs mt-1">{category.hz} Hz</Text>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Affirmations */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-400 text-sm">Affirmations</Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-500 text-xs">
                    {customAffirmations.length}/{subscription?.tier === "pro" ? "∞" : "20"}
                  </Text>
                  {subscription?.tier !== "pro" && customAffirmations.length >= 20 && (
                    <LockIcon size={12} placement="inline" />
                  )}
                </View>
              </View>
              {customAffirmations.length > 0 ? (
                customAffirmations.map((affirmation, index) => (
                  <View key={index} className="mb-3">
                    <View className="flex-row items-center">
                      <TextInput
                        value={affirmation}
                        onChangeText={(text) => {
                          if (text.length <= 200) {
                            handleUpdateAffirmation(index, text);
                          }
                        }}
                        placeholder={`Affirmation ${index + 1}`}
                        placeholderTextColor="#666"
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                        blurOnSubmit={true}
                        className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white text-base border border-white/20"
                        multiline
                        maxLength={200}
                      />
                      {customAffirmations.length > 1 && (
                        <Pressable
                          onPress={() => handleRemoveAffirmation(index)}
                          className="ml-2 p-2 active:opacity-80"
                        >
                          <X size={20} color="#EF4444" />
                        </Pressable>
                      )}
                    </View>
                    <Text className={`text-xs mt-1 text-right ${affirmation.length > 180 ? "text-red-400" : "text-gray-500"}`}>
                      {affirmation.length}/200
                    </Text>
                  </View>
                ))
              ) : (
                <View className="bg-white/5 rounded-xl p-6 border border-dashed border-white/20 mb-3">
                  <Text className="text-gray-400 text-center text-sm">
                    No affirmations yet. Select from library or write your own.
                  </Text>
                </View>
              )}

              <View className="flex-row gap-3 mt-2">
                <Pressable
                  onPress={() => {
                    const maxAffirmations = subscription?.tier === "pro" ? 999 : 20;
                    if (customAffirmations.length >= maxAffirmations && subscription?.tier !== "pro") {
                      setLockedFeatureName("Unlimited Affirmations");
                      setShowPaywallModal(true);
                      return;
                    }
                    setShowLibraryModal(true);
                  }}
                  className="flex-1 active:opacity-80"
                >
                  <View className={`flex-row items-center justify-center py-3 rounded-xl border border-white/30 bg-white/5 relative ${
                    subscription?.tier !== "pro" && customAffirmations.length >= 20 ? "opacity-60" : ""
                  }`}>
                    <BookOpen size={18} color="#9333EA" />
                    <Text className="text-purple-400 font-semibold ml-2">
                      Library
                    </Text>
                    {subscription?.tier !== "pro" && customAffirmations.length >= 20 && (
                      <LockIcon size={12} placement="top-right" />
                    )}
                  </View>
                </Pressable>
                <Pressable
                  onPress={handleAddAffirmation}
                  className="flex-1 active:opacity-80"
                >
                  <View className={`flex-row items-center justify-center py-3 rounded-xl border border-dashed border-white/30 relative ${
                    subscription?.tier !== "pro" && customAffirmations.length >= 20 ? "opacity-60" : ""
                  }`}>
                    <Plus size={18} color="#9333EA" />
                    <Text className="text-purple-400 font-semibold ml-2">
                      {subscription?.tier === "pro" ? "Add" : customAffirmations.length >= 20 ? "Max" : "Write"}
                    </Text>
                    {subscription?.tier !== "pro" && customAffirmations.length >= 20 && (
                      <LockIcon size={12} placement="top-right" />
                    )}
                  </View>
                </Pressable>
              </View>
            </View>

            <View className="h-40" />
          </Animated.View>
        )}
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Affirmation Library Modal */}
      <AffirmationLibraryModal
        visible={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onSelect={handleSelectFromLibrary}
        selectedCategoryId={selectedCategory || undefined}
        existingAffirmations={customAffirmations}
      />

      {/* Paywall Lock Modal */}
      <PaywallLockModal
        visible={showPaywallModal}
        onClose={() => {
          setShowPaywallModal(false);
          setLockedFeatureName(undefined);
        }}
        featureName={lockedFeatureName}
      />

      {/* Create Button (only show in manual edit mode) */}
      {showManualEdit && (
        <View className="px-6 pb-8 pt-4">
          {/* Error Message */}
          {errorMessage && (
            <View className="mb-3 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
              <Text className="text-red-400 text-center text-sm mb-3">{errorMessage}</Text>
              {errorMessage.includes("Upgrade to Pro") && (
                <Pressable
                  onPress={() => navigation.navigate("Subscription")}
                  className="active:opacity-80"
                >
                  <LinearGradient
                    colors={["#9333EA", "#F59E0B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="py-2 px-4 rounded-lg flex-row items-center justify-center"
                  >
                    <Crown size={16} color="#FFFFFF" />
                    <Text className="text-white font-semibold ml-2">Upgrade to Pro</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            onPress={handleCreateSession}
            disabled={!canProceed || isCreating}
            className="active:opacity-80"
          >
            <LinearGradient
              colors={canProceed && !isCreating ? ["#44B09E", "#2A7A6E"] : ["#333", "#444"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-4 rounded-2xl items-center"
            >
              {isCreating ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text className="text-white text-lg font-bold ml-2">
                    {existingSession ? "Saving..." : "Creating..."}
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-lg font-bold">
                  {existingSession ? "Save Changes" : "Create Session"}
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </LinearGradient>
  );
};

export default CreateSessionScreen;
