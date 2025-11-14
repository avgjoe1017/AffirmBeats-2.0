import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Modal, Keyboard, TouchableWithoutFeedback } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Search, Check } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  affirmationLibrary,
  getAffirmationsByCategory,
  getCategories,
  searchAffirmations,
  type Affirmation,
} from "@/data/affirmationLibrary";

interface AffirmationLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (affirmations: string[]) => void;
  selectedCategoryId?: string;
  existingAffirmations?: string[];
}

const AffirmationLibraryModal = ({
  visible,
  onClose,
  onSelect,
  selectedCategoryId,
  existingAffirmations = [],
}: AffirmationLibraryModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(selectedCategoryId || null);
  const [selectedAffirmationIds, setSelectedAffirmationIds] = useState<Set<string>>(
    new Set(existingAffirmations.map((text) => {
      // Try to find matching affirmation ID by text
      const found = affirmationLibrary.affirmations.find((a) => a.text === text);
      return found?.id || "";
    }).filter(Boolean))
  );

  const categories = getCategories();

  // Get affirmations based on search and category filter
  const displayedAffirmations = useMemo(() => {
    if (searchQuery.trim()) {
      return searchAffirmations(searchQuery, selectedCategory || undefined);
    }
    if (selectedCategory) {
      return getAffirmationsByCategory(selectedCategory);
    }
    return affirmationLibrary.affirmations;
  }, [searchQuery, selectedCategory]);

  const handleToggleAffirmation = (affirmation: Affirmation) => {
    const newSelected = new Set(selectedAffirmationIds);
    if (newSelected.has(affirmation.id)) {
      newSelected.delete(affirmation.id);
    } else {
      // Limit to 20 affirmations
      if (newSelected.size < 20) {
        newSelected.add(affirmation.id);
      }
    }
    setSelectedAffirmationIds(newSelected);
  };

  const handleAddSelected = () => {
    const selectedTexts = Array.from(selectedAffirmationIds)
      .map((id) => {
        const affirmation = affirmationLibrary.affirmations.find((a) => a.id === id);
        return affirmation?.text;
      })
      .filter((text): text is string => !!text);
    onSelect(selectedTexts);
    onClose();
  };

  const selectedCount = selectedAffirmationIds.size;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <LinearGradient colors={["#0F0F1E", "#1A1A2E"]} style={{ flex: 1 }}>
        {/* Header */}
        <View className="pt-14 px-6 pb-4 flex-row items-center justify-between border-b border-white/10">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Affirmation Library</Text>
            <Text className="text-gray-400 text-sm mt-1">
              {selectedCount > 0 ? `${selectedCount} selected` : "Select affirmations"}
            </Text>
          </View>
          <Pressable onPress={onClose} className="p-2 -mr-2">
            <X size={24} color="#F0F0F5" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="px-6 py-4">
          <View className="flex-row items-center bg-white/10 rounded-xl px-4 py-3 border border-white/20">
            <Search size={20} color="#666" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search affirmations..."
              placeholderTextColor="#666"
              className="flex-1 ml-3 text-white text-base"
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
              blurOnSubmit={true}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} className="ml-2">
                <X size={18} color="#666" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <View className="px-6 pb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
            <Pressable
              onPress={() => setSelectedCategory(null)}
              className="mr-3"
            >
              <View
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === null ? "bg-white" : "bg-white/10"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedCategory === null ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  All
                </Text>
              </View>
            </Pressable>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                className="mr-3"
              >
                <View
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === category.id ? "bg-white" : "bg-white/10"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedCategory === category.id ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {category.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Affirmations List */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {displayedAffirmations.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-400 text-center">
                {searchQuery ? "No affirmations found" : "No affirmations in this category"}
              </Text>
            </View>
          ) : (
            displayedAffirmations.map((affirmation, index) => {
              const isSelected = selectedAffirmationIds.has(affirmation.id);
              const category = categories.find((c) => c.id === affirmation.category_id);

              return (
                <Animated.View
                  key={affirmation.id}
                  entering={FadeIn.delay(index * 20).duration(300)}
                  className="mb-3"
                >
                  <Pressable
                    onPress={() => handleToggleAffirmation(affirmation)}
                    className="active:opacity-80"
                  >
                    <View
                      className={`bg-white/10 rounded-xl p-4 border-2 ${
                        isSelected ? "border-purple-400 bg-purple-400/10" : "border-white/20"
                      }`}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <View className="flex-row items-center mb-2">
                            {category && (
                              <View className="bg-white/20 px-2 py-1 rounded-full mr-2">
                                <Text className="text-white/70 text-xs font-semibold">
                                  {category.name}
                                </Text>
                              </View>
                            )}
                            <View className="bg-white/10 px-2 py-1 rounded-full">
                              <Text className="text-white/60 text-xs capitalize">
                                {affirmation.intensity}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-white text-base leading-6">
                            {affirmation.text}
                          </Text>
                        </View>
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                            isSelected
                              ? "bg-purple-400 border-purple-400"
                              : "border-white/30"
                          }`}
                        >
                          {isSelected && <Check size={16} color="#FFF" />}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })
          )}
          <View className="h-24" />
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Footer with Add Button */}
        {selectedCount > 0 && (
          <View className="px-6 py-4 border-t border-white/10 bg-black/50">
            <Pressable onPress={handleAddSelected} className="active:opacity-80">
              <LinearGradient
                colors={["#8B7AB8", "#6B5A98"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 rounded-2xl items-center"
              >
                <Text className="text-white text-lg font-bold">
                  Add {selectedCount} Affirmation{selectedCount !== 1 ? "s" : ""}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </LinearGradient>
    </Modal>
  );
};

export default AffirmationLibraryModal;

