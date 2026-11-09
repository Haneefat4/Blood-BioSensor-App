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
import { READING_CONFIG, READING_TAGS } from "@/types";

interface ReadingListItemProps {
  reading: Reading;
  onPress?: () => void;
  onDelete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ReadingListItem({
  reading,
  onPress,
  onDelete,
}: ReadingListItemProps) {
  const { theme, isDark } = useTheme();
  const { valueText, unitText } = useReadingDisplay();
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

  const formattedDate = new Date(reading.timestamp).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const tagLabels = reading.tags?.map((tagId) => {
    const tag = READING_TAGS.find((t) => t.id === tagId);
    return tag?.label || tagId;
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
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.primary + "1A" },
        ]}
      >
        <Feather name={config.icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.type}>{config.label}</ThemedText>
            {reading.isFasting ? (
              <View
                style={[
                  styles.fastingBadge,
                  { backgroundColor: colors.warning + "20" },
                ]}
              >
                <Feather name="clock" size={10} color={colors.warning} />
                <ThemedText
                  style={[styles.fastingText, { color: colors.warning }]}
                >
                  Fasting
                </ThemedText>
              </View>
            ) : null}
          </View>
          <StatusBadge status={reading.status} />
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.valueContainer}>
            <ThemedText style={styles.value}>{valueText(reading)}</ThemedText>
            <ThemedText style={[styles.unit, { color: theme.textSecondary }]}>
              {unitText(reading.type)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
            {formattedDate}
          </ThemedText>
        </View>
        {tagLabels && tagLabels.length > 0 ? (
          <View style={styles.tagsRow}>
            {tagLabels.map((label, index) => (
              <View
                key={index}
                style={[
                  styles.tagChip,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <ThemedText style={[styles.tagText, { color: colors.primary }]}>
                  {label}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}
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
    alignItems: "flex-start",
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  type: {
    fontSize: 16,
    fontWeight: "600",
  },
  fastingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  fastingText: {
    fontSize: 10,
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
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tagChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
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
