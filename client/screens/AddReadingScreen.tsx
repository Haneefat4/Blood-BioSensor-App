import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useReadingsContext } from "@/context/ReadingsContext";
import type { ReadingType } from "@/types";
import { READING_CONFIG } from "@/types";

const READING_TYPES: ReadingType[] = ["glucose", "hemoglobin", "cholesterol", "platelets"];

export default function AddReadingScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const navigation = useNavigation();
  const { addReading } = useReadingsContext();

  const [selectedType, setSelectedType] = useState<ReadingType>("glucose");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const config = READING_CONFIG[selectedType];

  const handleSave = async () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      Alert.alert("Invalid Value", "Please enter a valid positive number.");
      return;
    }

    setIsSaving(true);
    try {
      await addReading(selectedType, numValue, notes.trim() || undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save reading. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ThemedText style={styles.label}>Reading Type</ThemedText>
      <View style={styles.typeGrid}>
        {READING_TYPES.map((type) => {
          const typeConfig = READING_CONFIG[type];
          const isSelected = selectedType === type;
          return (
            <Pressable
              key={type}
              onPress={() => setSelectedType(type)}
              style={({ pressed }) => [
                styles.typeCard,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : theme.backgroundDefault,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather
                name={typeConfig.icon as any}
                size={24}
                color={isSelected ? "#FFFFFF" : colors.primary}
              />
              <ThemedText
                style={[
                  styles.typeLabel,
                  { color: isSelected ? "#FFFFFF" : theme.text },
                ]}
              >
                {typeConfig.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText style={styles.label}>Value</ThemedText>
      <View style={styles.valueContainer}>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.valueInput,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
            },
          ]}
        />
        <View
          style={[
            styles.unitBadge,
            { backgroundColor: colors.primary + "1A" },
          ]}
        >
          <ThemedText style={[styles.unitText, { color: colors.primary }]}>
            {config.defaultUnit}
          </ThemedText>
        </View>
      </View>

      <View style={styles.rangeInfo}>
        <Feather name="info" size={14} color={theme.textSecondary} />
        <ThemedText style={[styles.rangeText, { color: theme.textSecondary }]}>
          Normal range: {config.normalRange.min} - {config.normalRange.max} {config.defaultUnit}
        </ThemedText>
      </View>

      <ThemedText style={styles.label}>Notes (Optional)</ThemedText>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Add any additional notes..."
        placeholderTextColor={theme.textSecondary}
        multiline
        numberOfLines={3}
        style={[
          styles.notesInput,
          {
            backgroundColor: theme.backgroundDefault,
            color: theme.text,
          },
        ]}
      />

      <View style={styles.buttonContainer}>
        <Button onPress={handleSave} disabled={isSaving || !value}>
          {isSaving ? "Saving..." : "Save Reading"}
        </Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  typeCard: {
    width: "48%",
    flexGrow: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  valueInput: {
    flex: 1,
    height: 64,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  unitBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  unitText: {
    fontSize: 16,
    fontWeight: "600",
  },
  rangeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing["2xl"],
  },
  rangeText: {
    fontSize: 13,
  },
  notesInput: {
    minHeight: 100,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: Spacing["2xl"],
  },
  buttonContainer: {
    marginTop: "auto",
  },
});
