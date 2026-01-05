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
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { Reading } from "@/types";
import { READING_CONFIG } from "@/types";

interface ReadingListItemProps {
  reading: Reading;
  onPress?: () => void;
  onDelete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ReadingListItem({ reading, onPress, onDelete }: ReadingListItemProps) {
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const config = READING_CONFIG[reading.type];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const formattedDate = new Date(reading.timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + "1A" }]}>
        <Feather name={config.icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <ThemedText style={styles.type}>{config.label}</ThemedText>
          <StatusBadge status={reading.status} />
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.valueContainer}>
            <ThemedText style={styles.value}>{reading.value}</ThemedText>
            <ThemedText style={[styles.unit, { color: theme.textSecondary }]}>
              {reading.unit}
            </ThemedText>
          </View>
          <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
            {formattedDate}
          </ThemedText>
        </View>
        {reading.notes ? (
          <ThemedText
            style={[styles.notes, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {reading.notes}
          </ThemedText>
        ) : null}
      </View>
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [
            styles.deleteButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="trash-2" size={18} color={colors.error} />
        </Pressable>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  type: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
  },
  unit: {
    fontSize: 12,
  },
  date: {
    fontSize: 12,
  },
  notes: {
    fontSize: 12,
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  deleteButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
});
