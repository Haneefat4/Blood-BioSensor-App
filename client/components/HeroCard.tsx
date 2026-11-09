import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { useTheme } from "@/hooks/useTheme";
import { useReadingDisplay } from "@/hooks/useReadingDisplay";
import { BorderRadius, Spacing, Colors, Typography } from "@/constants/theme";
import type { Reading } from "@/types";
import { READING_CONFIG } from "@/types";

interface HeroCardProps {
  reading?: Reading;
  onPress?: () => void;
}

export function HeroCard({ reading, onPress }: HeroCardProps) {
  const { isDark } = useTheme();
  const { valueText, unitText, assess } = useReadingDisplay();
  const colors = isDark ? Colors.dark : Colors.light;

  if (!reading) {
    return (
      <CardShell
        onPress={onPress}
        label="No readings yet. Add a reading."
        hint="Opens the form to add a reading"
        backgroundColor={colors.primary}
      >
        <View style={styles.emptyContent}>
          <Feather name="plus-circle" size={48} color="rgba(255,255,255,0.7)" />
          <ThemedText style={styles.emptyTitle}>No readings yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Tap here or the + button to add your first reading
          </ThemedText>
        </View>
      </CardShell>
    );
  }

  const config = READING_CONFIG[reading.type];
  const assessment = assess(reading);
  const timeAgo = getTimeAgo(reading.timestamp);

  return (
    <CardShell
      onPress={onPress}
      label={`${config.label}, ${valueText(reading)} ${unitText(reading.type)}, ${assessment.label}, ${timeAgo}`}
      hint="Opens this reading"
      backgroundColor={colors.primary}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrapper}>
            <Feather name={config.icon as any} size={20} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.typeLabel}>{config.label}</ThemedText>
        </View>
        <StatusBadge status={assessment.severity} label={assessment.label} />
      </View>
      <View style={styles.valueSection}>
        <ThemedText type="readingDisplay" style={styles.value}>
          {valueText(reading)}
        </ThemedText>
        <ThemedText style={styles.unit}>{unitText(reading.type)}</ThemedText>
      </View>
      <ThemedText style={styles.timestamp}>{timeAgo}</ThemedText>
    </CardShell>
  );
}

function CardShell({
  children,
  onPress,
  label,
  hint,
  backgroundColor,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  label: string;
  hint: string;
  backgroundColor: string;
}) {
  if (!onPress) {
    return (
      <View
        accessible
        accessibilityRole="summary"
        accessibilityLabel={label}
        style={[styles.container, { backgroundColor }]}
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff < 0) {
    return new Date(timestamp).toLocaleString();
  }
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius["2xl"],
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  valueSection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  value: {
    ...Typography.readingDisplay,
    color: "#FFFFFF",
  },
  unit: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    fontWeight: "500",
  },
  timestamp: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
