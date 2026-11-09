import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { PRIVACY_SECTIONS } from "@/content/legalCopy";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

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
      {PRIVACY_SECTIONS.map((section) => (
        <View
          key={section.title}
          style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.headingRow}>
            <Feather name={section.icon} size={20} color={colors.primary} />
            <ThemedText accessibilityRole="header" style={styles.heading}>
              {section.title}
            </ThemedText>
          </View>
          {section.paragraphs.map((paragraph) => (
            <ThemedText
              key={paragraph}
              style={[styles.body, { color: theme.textSecondary }]}
            >
              {paragraph}
            </ThemedText>
          ))}
        </View>
      ))}
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
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
});
