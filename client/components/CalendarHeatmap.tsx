import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { Reading } from "@/types";

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

  const getStatusColor = (dayReadings: Reading[]): string => {
    if (dayReadings.length === 0) return theme.backgroundSecondary;
    const hasCritical = dayReadings.some((r) => r.status === "critical");
    const hasWarning = dayReadings.some((r) => r.status === "warning");
    if (hasCritical) return colors.error + "80";
    if (hasWarning) return colors.warning + "80";
    return colors.success + "80";
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
                  style={[
                    styles.cell,
                    {
                      backgroundColor: getStatusColor(day.readings),
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
        <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
          Less
        </ThemedText>
        <View
          style={[
            styles.legendCell,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        />
        <View
          style={[
            styles.legendCell,
            { backgroundColor: colors.success + "50" },
          ]}
        />
        <View
          style={[
            styles.legendCell,
            { backgroundColor: colors.warning + "70" },
          ]}
        />
        <View
          style={[styles.legendCell, { backgroundColor: colors.error + "80" }]}
        />
        <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
          More
        </ThemedText>
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
    height: 12,
    lineHeight: 12,
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
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: Spacing.md,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
});
