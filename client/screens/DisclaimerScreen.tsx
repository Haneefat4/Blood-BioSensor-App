import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { NOT_MEDICAL_ADVICE } from "@/content/legalCopy";
import { useTheme } from "@/hooks/useTheme";
import {
  BorderRadius,
  MinTouchTarget,
  Spacing,
  Colors,
} from "@/constants/theme";

interface DisclaimerScreenProps {
  onAccept: () => Promise<void>;
}

export function DisclaimerScreen({ onAccept }: DisclaimerScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!checked || saving) return;
    setSaving(true);
    try {
      await onAccept();
    } catch {
      Alert.alert(
        "Could not save",
        "The acknowledgement could not be saved on this device. Please try again.",
      );
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <View
          style={[styles.iconWrap, { backgroundColor: colors.primary + "1A" }]}
        >
          <Feather name="alert-circle" size={28} color={colors.primary} />
        </View>
        <ThemedText type="h2" accessibilityRole="header" style={styles.title}>
          Not medical advice
        </ThemedText>
        {NOT_MEDICAL_ADVICE.map((paragraph) => (
          <ThemedText
            key={paragraph}
            style={[styles.body, { color: theme.textSecondary }]}
          >
            {paragraph}
          </ThemedText>
        ))}
        <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
          Your log stays on this device. There is no account. The privacy policy
          is in Profile after you continue.
        </ThemedText>
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.lg,
            backgroundColor: theme.backgroundRoot,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Pressable
          onPress={() => setChecked((current) => !current)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel="I understand this app is not a medical device and does not give medical advice"
          style={({ pressed }) => [
            styles.checkRow,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather
            name={checked ? "check-square" : "square"}
            size={22}
            color={checked ? colors.primary : theme.textSecondary}
          />
          <ThemedText style={styles.checkLabel}>
            I understand this is not a medical device and not medical advice.
          </ThemedText>
        </Pressable>
        <Button onPress={handleContinue} disabled={!checked || saving}>
          {saving ? "Saving..." : "Continue"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.md,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  checkRow: {
    minHeight: MinTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  checkLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
});
