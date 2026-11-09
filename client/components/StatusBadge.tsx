import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { ReadingStatus } from "@/types";

interface StatusBadgeProps {
  status: ReadingStatus;
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  normal: { label: "Normal", icon: "check-circle" as const },
  warning: { label: "Warning", icon: "alert-circle" as const },
  critical: { label: "Critical", icon: "alert-triangle" as const },
};

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const statusColor =
    status === "normal"
      ? colors.success
      : status === "warning"
        ? colors.warning
        : colors.error;

  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.container, { backgroundColor: statusColor + "1A" }]}>
      <Feather name={config.icon} size={14} color={statusColor} />
      {showLabel ? (
        <ThemedText style={[styles.label, { color: statusColor }]}>
          {config.label}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
