import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useReadingDisplay } from "@/hooks/useReadingDisplay";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { Reading, ReadingStatus } from "@/types";

interface CalendarHeatmapProps {
  readings: Reading[];
  onDayPress?: (date: Date, readings: Reading[]) => void;
}

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKS_TO_SHOW = 12;

export function CalendarHeatmap({
  readings,
  onDayPress,
}: CalendarHeatmapProps) {
  const { theme, isDark } = useTheme();
  const { assess } = useReadingDisplay();
  const colors = isDark ? Colors.dark : Colors.light;

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - WEEKS_TO_SHOW * 7 + 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const readingsByDate = new Map<string, Reading[]>();
    readings.forEach((reading) => {
      const dateKey = new Date(reading.timestamp).toDateString();
      const existing = readingsByDate.get(dateKey) || [];
      existing.push(reading);
      readingsByDate.set(dateKey, existing);
    });

    const weeksArr: { date: Date; readings: Reading[]; isToday: boolean }[][] =
      [];
    const labels: { week: number; label: string }[] = [];
    let currentDate = new Date(startDate);
    let lastMonth = -1;

    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
      const week: { date: Date; readings: Reading[]; isToday: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(currentDate);
        const dateKey = date.toDateString();
        const dayReadings = readingsByDate.get(dateKey) || [];
        const isToday = date.toDateString() === today.toDateString();

        if (date.getMonth() !== lastMonth && date.getDate() <= 7) {
          labels.push({
            week: w,
            label: date.toLocaleDateString(undefined, { month: "short" }),
          });
          lastMonth = date.getMonth();
        }

        week.push({ date, readings: dayReadings, isToday });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeksArr.push(week);
    }

    return { weeks: weeksArr, monthLabels: labels };
  }, [readings]);

  const strongest = (dayReadings: Reading[]): ReadingStatus | "empty" => {
    if (dayReadings.length === 0) return "empty";
    if (
      dayReadings.some((reading) => assess(reading).severity === "critical")
    ) {
      return "critical";
    }
    if (dayReadings.some((reading) => assess(reading).severity === "warning")) {
      return "warning";
    }
    return "normal";
  };

  const describeDay = (day: { date: Date; readings: Reading[] }): string => {
    const dateLabel = day.date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const level = strongest(day.readings);
    if (level === "empty") return `${dateLabel}. No readings.`;
    const count = `${day.readings.length} reading${day.readings.length === 1 ? "" : "s"}`;
    if (level === "critical") {
      return `${dateLabel}. ${count}. Includes a reading far outside the usual range.`;
    }
    if (level === "warning") {
      return `${dateLabel}. ${count}. Includes a reading outside the usual range.`;
    }
    return `${dateLabel}. ${count}. Inside the usual range.`;
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.header}>
        <Feather name="calendar" size={18} color={colors.primary} />
        <ThemedText style={styles.title}>Reading Activity</ThemedText>
      </View>

      <View style={styles.monthLabelsRow}>
        {monthLabels.map((m, i) => (
          <ThemedText
            key={i}
            style={[
              styles.monthLabel,
              { left: m.week * 14 + 20, color: theme.textSecondary },
            ]}
          >
            {m.label}
          </ThemedText>
        ))}
      </View>

      <View style={styles.grid}>
        <View style={styles.daysColumn}>
          {DAYS_OF_WEEK.map((day, i) => (
            <ThemedText
              key={i}
              style={[styles.dayLabel, { color: theme.textSecondary }]}
            >
              {i % 2 === 1 ? day : ""}
            </ThemedText>
          ))}
        </View>

        <View style={styles.weeksContainer}>
          {weeks.map((week, wIndex) => (
            <View key={wIndex} style={styles.weekColumn}>
              {week.map((day, dIndex) => (
                <Pressable
                  key={dIndex}
                  onPress={() => {
                    if (day.readings.length > 0 && onDayPress) {
                      Haptics.selectionAsync();
                      onDayPress(day.date, day.readings);
                    }
                  }}
                  accessibilityRole={
                    day.readings.length > 0 ? "button" : "text"
                  }
                  accessibilityLabel={describeDay(day)}
                  accessibilityState={{ disabled: day.readings.length === 0 }}
                  style={[
                    styles.cell,
                    strongest(day.readings) === "normal" ? styles.circle : null,
                    strongest(day.readings) === "critical"
                      ? styles.diamond
                      : null,
                    {
                      backgroundColor:
                        strongest(day.readings) === "empty"
                          ? theme.backgroundSecondary
                          : strongest(day.readings) === "critical"
                            ? colors.error
                            : strongest(day.readings) === "warning"
                              ? colors.warning
                              : colors.success,
                      borderWidth: day.isToday ? 2 : 0,
                      borderColor: colors.primary,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendCell,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          />
          <ThemedText
            style={[styles.legendText, { color: theme.textSecondary }]}
          >
            None
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendCell,
              styles.circle,
              { backgroundColor: colors.success },
            ]}
          />
          <ThemedText
            style={[styles.legendText, { color: theme.textSecondary }]}
          >
            In usual range
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendCell, { backgroundColor: colors.warning }]}
          />
          <ThemedText
            style={[styles.legendText, { color: theme.textSecondary }]}
          >
            Outside
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendCell,
              styles.diamond,
              { backgroundColor: colors.error },
            ]}
          />
          <ThemedText
            style={[styles.legendText, { color: theme.textSecondary }]}
          >
            Far outside
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  monthLabelsRow: {
    position: "relative",
    height: 16,
    marginLeft: 20,
    marginBottom: Spacing.xs,
  },
  monthLabel: {
    position: "absolute",
    fontSize: 10,
  },
  grid: {
    flexDirection: "row",
  },
  daysColumn: {
    marginRight: Spacing.xs,
  },
  dayLabel: {
    fontSize: 9,
    height: 16,
    lineHeight: 14,
    textAlign: "center",
  },
  weeksContainer: {
    flexDirection: "row",
    gap: 2,
    flex: 1,
  },
  weekColumn: {
    gap: 2,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  circle: {
    borderRadius: 7,
  },
  diamond: {
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
});
