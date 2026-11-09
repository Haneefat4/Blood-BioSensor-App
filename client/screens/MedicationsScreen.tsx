import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  FlatList,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import {
  Spacing,
  BorderRadius,
  Colors,
  MinTouchTarget,
} from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useMedicationsContext } from "@/context/MedicationsContext";
import type { Medication } from "@/types";

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "As needed",
  "Weekly",
];

export default function MedicationsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { medications, addMedication, removeMedication } =
    useMedicationsContext();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState(FREQUENCIES[0]);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert(
        "Required Fields",
        "Please enter medication name and dosage.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await addMedication(
        name.trim(),
        dosage.trim(),
        frequency,
        time.trim() || undefined,
        notes.trim() || undefined,
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
    } catch {
      Alert.alert("Error", "Failed to save medication.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDosage("");
    setFrequency(FREQUENCIES[0]);
    setTime("");
    setNotes("");
    setShowForm(false);
  };

  const handleDelete = (med: Medication) => {
    Alert.alert(
      "Delete Medication",
      `Are you sure you want to delete ${med.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await removeMedication(med.id);
          },
        },
      ],
    );
  };

  const renderMedication = ({ item }: { item: Medication }) => (
    <View
      style={[styles.medCard, { backgroundColor: theme.backgroundDefault }]}
    >
      <View
        style={[styles.medIcon, { backgroundColor: colors.primary + "1A" }]}
      >
        <Feather name="plus-circle" size={20} color={colors.primary} />
      </View>
      <View style={styles.medContent}>
        <ThemedText style={styles.medName}>{item.name}</ThemedText>
        <ThemedText style={[styles.medDosage, { color: theme.textSecondary }]}>
          {item.dosage} - {item.frequency}
        </ThemedText>
        {item.time ? (
          <ThemedText style={[styles.medTime, { color: theme.textSecondary }]}>
            Time: {item.time}
          </ThemedText>
        ) : null}
        {item.notes ? (
          <ThemedText
            style={[styles.medNotes, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.notes}
          </ThemedText>
        ) : null}
      </View>
      <Pressable
        onPress={() => handleDelete(item)}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${item.name}`}
        style={({ pressed }) => [
          styles.deleteBtn,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Feather name="trash-2" size={18} color={colors.error} />
      </Pressable>
    </View>
  );

  if (showForm) {
    return (
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <ThemedText style={styles.formTitle}>Add Medication</ThemedText>

        <ThemedText style={styles.label}>Medication Name</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          accessibilityLabel="Medication name"
          placeholder="e.g., Metformin"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { backgroundColor: theme.backgroundDefault, color: theme.text },
          ]}
        />

        <ThemedText style={styles.label}>Dosage</ThemedText>
        <TextInput
          value={dosage}
          onChangeText={setDosage}
          accessibilityLabel="Dosage"
          placeholder="e.g., 500mg"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { backgroundColor: theme.backgroundDefault, color: theme.text },
          ]}
        />

        <ThemedText style={styles.label}>Frequency</ThemedText>
        <View style={styles.freqGrid}>
          {FREQUENCIES.map((freq) => (
            <Pressable
              key={freq}
              onPress={() => setFrequency(freq)}
              accessibilityRole="radio"
              accessibilityState={{ selected: frequency === freq }}
              accessibilityLabel={freq}
              style={[
                styles.freqChip,
                {
                  backgroundColor:
                    frequency === freq
                      ? colors.primary
                      : theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.freqText,
                  { color: frequency === freq ? "#FFFFFF" : theme.text },
                ]}
              >
                {freq}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.label}>Time (Optional)</ThemedText>
        <TextInput
          value={time}
          onChangeText={setTime}
          accessibilityLabel="Time"
          placeholder="e.g., 8:00 AM"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { backgroundColor: theme.backgroundDefault, color: theme.text },
          ]}
        />

        <ThemedText style={styles.label}>Notes (Optional)</ThemedText>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          accessibilityLabel="Notes"
          placeholder="Any additional notes..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={2}
          style={[
            styles.notesInput,
            { backgroundColor: theme.backgroundDefault, color: theme.text },
          ]}
        />

        <View style={styles.buttonRow}>
          <Pressable
            onPress={resetForm}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={[
              styles.cancelBtn,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText style={{ color: theme.text }}>Cancel</ThemedText>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Button onPress={handleAdd} disabled={isSaving}>
              {isSaving ? "Saving..." : "Add Medication"}
            </Button>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        renderItem={renderMedication}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="plus-circle"
            title="No Medications"
            subtitle="Add your medications to track them alongside your health readings."
          />
        }
      />
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowForm(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Add medication"
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: tabBarHeight + Spacing.lg,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  input: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  notesInput: {
    minHeight: 80,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: Spacing.xl,
  },
  freqGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  freqChip: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  freqText: {
    fontSize: 13,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelBtn: {
    flex: 0.5,
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
  },
  medCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  medIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  medContent: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: "600",
  },
  medDosage: {
    fontSize: 14,
    marginTop: 2,
  },
  medTime: {
    fontSize: 12,
    marginTop: 2,
  },
  medNotes: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: "italic",
  },
  deleteBtn: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
