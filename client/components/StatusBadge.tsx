import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { ReadingStatus } from "@/types";

interface StatusBadgeProps {
  status: ReadingStatus;
  /** Plain label such as Low, High, or Elevated. Falls back to a short severity word. */
  label?: string;
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  normal: { label: "Normal", icon: "check-circle" as const },
  warning: { label: "Out of range", icon: "alert-circle" as const },
  critical: { label: "Far out of range", icon: "alert-triangle" as const },
};

export function colorForSeverity(
  severity: ReadingStatus,
  palette: { success: string; warning: string; error: string },
): string {
  if (severity === "normal") return palette.success;
  if (severity === "warning") return palette.warning;
  return palette.error;
}

export function StatusBadge({
  status,
  label,
  showLabel = true,
}: StatusBadgeProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const statusColor = colorForSeverity(status, colors);
  const config = STATUS_CONFIG[status];
  const text = label ?? config.label;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      style={[styles.container, { backgroundColor: statusColor + "1A" }]}
    >
      <Feather name={config.icon} size={14} color={statusColor} />
      {showLabel ? (
        <ThemedText style={[styles.label, { color: statusColor }]}>
          {text}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
});
