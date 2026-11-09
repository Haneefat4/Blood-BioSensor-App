import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { useTheme } from "@/hooks/useTheme";
import { useReadingDisplay } from "@/hooks/useReadingDisplay";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { Reading } from "@/types";
import { READING_CONFIG } from "@/types";

interface QuickStatCardProps {
  reading?: Reading;
  type: Reading["type"];
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QuickStatCard({ reading, type, onPress }: QuickStatCardProps) {
  const { theme, isDark } = useTheme();
  const { valueText, unitText, assess } = useReadingDisplay();
  const colors = isDark ? Colors.dark : Colors.light;
  const config = READING_CONFIG[type];
  const assessment = reading ? assess(reading) : undefined;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const summary = reading
    ? `${config.label}, ${valueText(reading)} ${unitText(type)}, ${assessment?.label ?? "no comparison"}`
    : `${config.label}, no reading yet`;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      accessible
      accessibilityRole={onPress ? "button" : "summary"}
      accessibilityLabel={summary}
      accessibilityHint={
        onPress
          ? reading
            ? "Opens this reading"
            : `Adds a ${config.label} reading`
          : undefined
      }
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primary + "1A" },
          ]}
        >
          <Feather name={config.icon as any} size={16} color={colors.primary} />
        </View>
        {assessment ? (
          <StatusBadge status={assessment.severity} label={assessment.label} />
        ) : null}
      </View>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
        {config.label}
      </ThemedText>
      {reading ? (
        <View style={styles.valueRow}>
          <ThemedText style={styles.value}>{valueText(reading)}</ThemedText>
          <ThemedText style={[styles.unit, { color: theme.textSecondary }]}>
            {unitText(type)}
          </ThemedText>
        </View>
      ) : (
        <ThemedText style={[styles.noData, { color: theme.textSecondary }]}>
          No data
        </ThemedText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minWidth: 140,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
  },
  unit: {
    fontSize: 12,
  },
  noData: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
