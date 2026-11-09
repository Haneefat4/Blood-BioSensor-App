import React from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { SettingsRow } from "@/components/SettingsRow";
import { ThemedText } from "@/components/ThemedText";
import { NOT_MEDICAL_ADVICE, PRIVACY_UPDATED } from "@/content/legalCopy";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

function versionLabel(): string {
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const iosBuild = Constants.expoConfig?.ios?.buildNumber;
  const androidCode = Constants.expoConfig?.android?.versionCode;
  const build =
    Platform.OS === "android"
      ? androidCode != null
        ? String(androidCode)
        : iosBuild
      : (iosBuild ?? (androidCode != null ? String(androidCode) : undefined));
  return build ? `${version} (${build})` : version;
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

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
      <ThemedText type="h2" accessibilityRole="header" style={styles.title}>
        Blood Biosensor
      </ThemedText>
      <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
        Version {versionLabel()}
      </ThemedText>
      <ThemedText style={[styles.lead, { color: theme.textSecondary }]}>
        A personal log for numbers you enter. It stores them on this device.
      </ThemedText>

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText accessibilityRole="header" style={styles.cardTitle}>
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
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <SettingsRow
          icon="shield"
          label="Privacy policy"
          onPress={() => navigation.navigate("PrivacyPolicy")}
        />
        <ThemedText style={[styles.updated, { color: theme.textSecondary }]}>
          Privacy policy updated {PRIVACY_UPDATED}.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  version: {
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  lead: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  updated: {
    fontSize: 13,
    marginTop: Spacing.sm,
  },
});
