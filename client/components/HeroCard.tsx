import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors, Typography } from "@/constants/theme";
import type { Reading } from "@/types";
import { READING_CONFIG } from "@/types";

interface HeroCardProps {
  reading?: Reading;
}

export function HeroCard({ reading }: HeroCardProps) {
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  if (!reading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary }]}>
        <View style={styles.emptyContent}>
          <Feather name="plus-circle" size={48} color="rgba(255,255,255,0.7)" />
          <ThemedText style={styles.emptyTitle}>No readings yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Tap the + button to add your first reading
          </ThemedText>
        </View>
      </View>
    );
  }

  const config = READING_CONFIG[reading.type];
  const timeAgo = getTimeAgo(reading.timestamp);

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrapper}>
            <Feather name={config.icon as any} size={20} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.typeLabel}>{config.label}</ThemedText>
        </View>
        <StatusBadge status={reading.status} />
      </View>
      <View style={styles.valueSection}>
        <ThemedText style={styles.value}>{reading.value}</ThemedText>
        <ThemedText style={styles.unit}>{reading.unit}</ThemedText>
      </View>
      <ThemedText style={styles.timestamp}>{timeAgo}</ThemedText>
    </View>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

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
