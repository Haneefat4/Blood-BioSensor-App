import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useReadingDisplay } from "@/hooks/useReadingDisplay";
import { formatMeasurement } from "@/lib/units";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { Reading, ReadingType } from "@/types";

interface TrendChartProps {
  readings: Reading[];
  type: ReadingType;
}

const CHART_HEIGHT = 120;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 4;

export function TrendChart({ readings, type }: TrendChartProps) {
  const { theme, isDark } = useTheme();
  const { units, unitText } = useReadingDisplay();
  const colors = isDark ? Colors.dark : Colors.light;
  const trendTitle = `7-Day Trend (${unitText(type)})`;

  const filteredReadings = readings
    .filter((r) => r.type === type)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-7);

  if (filteredReadings.length < 2) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      >
        <ThemedText style={styles.title}>{trendTitle}</ThemedText>
        <View style={styles.emptyChart}>
          <ThemedText
            style={[styles.emptyText, { color: theme.textSecondary }]}
          >
            Add more readings to see trends
          </ThemedText>
        </View>
      </View>
    );
  }

  const values = filteredReadings.map((r) => r.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const points = filteredReadings.map((r, i) => ({
    x: (i / (filteredReadings.length - 1)) * (CHART_WIDTH - Spacing.xl * 2),
    y: CHART_HEIGHT - ((r.value - minValue) / range) * (CHART_HEIGHT - 20) - 10,
    value: r.value,
  }));

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <ThemedText style={styles.title}>{trendTitle}</ThemedText>
      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          <ThemedText
            style={[styles.axisLabel, { color: theme.textSecondary }]}
          >
            {formatMeasurement(type, maxValue, units)}
          </ThemedText>
          <ThemedText
            style={[styles.axisLabel, { color: theme.textSecondary }]}
          >
            {formatMeasurement(type, minValue, units)}
          </ThemedText>
        </View>
        <View style={styles.chart}>
          <View style={[styles.gridLine, { backgroundColor: theme.border }]} />
          <View
            style={[
              styles.gridLine,
              styles.gridLineBottom,
              { backgroundColor: theme.border },
            ]}
          />
          {points.map((point, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  left: point.x + Spacing.lg,
                  top: point.y,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          ))}
          {points.slice(0, -1).map((point, index) => {
            const nextPoint = points[index + 1];
            const dx = nextPoint.x - point.x;
            const dy = nextPoint.y - point.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={`line-${index}`}
                style={[
                  styles.line,
                  {
                    left: point.x + Spacing.lg + 4,
                    top: point.y + 4,
                    width: length,
                    backgroundColor: colors.primary,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  chartContainer: {
    flexDirection: "row",
    height: CHART_HEIGHT,
  },
  yAxis: {
    width: 40,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  axisLabel: {
    fontSize: 11,
  },
  chart: {
    flex: 1,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    top: 10,
  },
  gridLineBottom: {
    top: undefined,
    bottom: 10,
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  line: {
    position: "absolute",
    height: 2,
    transformOrigin: "left center",
  },
  emptyChart: {
    height: CHART_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
