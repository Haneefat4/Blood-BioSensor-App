import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.headingRow}>
          <Feather name="smartphone" size={20} color={colors.primary} />
          <ThemedText style={styles.heading}>Stored on this device</ThemedText>
        </View>
        <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
          Readings, medications, reminders, photos you attach, and profile
          preferences stay on this device. Blood Biosensor does not create an
          account and does not upload that information to a server.
        </ThemedText>
      </View>

      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.headingRow}>
          <Feather name="share-2" size={20} color={colors.primary} />
          <ThemedText style={styles.heading}>Exports you choose</ThemedText>
        </View>
        <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
          CSV and PDF exports leave the app only when you share or save them.
          Clearing all data removes the local copy and cancels scheduled
          reminders.
        </ThemedText>
      </View>

      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.headingRow}>
          <Feather name="alert-circle" size={20} color={colors.warning} />
          <ThemedText style={styles.heading}>Not medical advice</ThemedText>
        </View>
        <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
          This app is a personal log, not a medical device. It does not
          diagnose, treat, or interpret your health. Ranges shown here are
          general reference points. Talk with a qualified clinician about your
          results and before changing any treatment.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
});
