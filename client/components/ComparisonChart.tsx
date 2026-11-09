import React, { useMemo, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import {
  BorderRadius,
  MinTouchTarget,
  Spacing,
  Colors,
} from "@/constants/theme";
import type { Reading, ReadingType } from "@/types";
import { READING_CONFIG } from "@/types";

interface ComparisonChartProps {
  readings: Reading[];
}

const READING_TYPES: ReadingType[] = [
  "glucose",
  "hemoglobin",
  "cholesterol",
  "platelets",
];
const TYPE_COLORS: Record<ReadingType, string> = {
  glucose: "#3B82F6",
  hemoglobin: "#EF4444",
  cholesterol: "#F59E0B",
  platelets: "#22C55E",
};

const CHART_HEIGHT = 140;

export function ComparisonChart({ readings }: ComparisonChartProps) {
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [selectedTypes, setSelectedTypes] = useState<ReadingType[]>([
    "glucose",
    "hemoglobin",
  ]);
  const [plotWidth, setPlotWidth] = useState(0);

  const toggleType = (type: ReadingType) => {
    Haptics.selectionAsync();
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const chartData = useMemo(() => {
    const last7Days: Date[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push(date);
    }

    const dataByType: Record<ReadingType, (number | null)[]> = {
      glucose: [],
      hemoglobin: [],
      cholesterol: [],
      platelets: [],
    };

    const minMax: Record<ReadingType, { min: number; max: number }> = {
      glucose: { min: Infinity, max: -Infinity },
      hemoglobin: { min: Infinity, max: -Infinity },
      cholesterol: { min: Infinity, max: -Infinity },
      platelets: { min: Infinity, max: -Infinity },
    };

    last7Days.forEach((day) => {
      const dayStart = day.getTime();
      const dayEnd = dayStart + 86400000;

      READING_TYPES.forEach((type) => {
        const dayReadings = readings.filter(
          (r) =>
            r.type === type && r.timestamp >= dayStart && r.timestamp < dayEnd,
        );
        if (dayReadings.length > 0) {
          const avg =
            dayReadings.reduce((sum, r) => sum + r.value, 0) /
            dayReadings.length;
          dataByType[type].push(avg);
          minMax[type].min = Math.min(minMax[type].min, avg);
          minMax[type].max = Math.max(minMax[type].max, avg);
        } else {
          dataByType[type].push(null);
        }
      });
    });

    return { days: last7Days, dataByType, minMax };
  }, [readings]);

  const renderLine = (type: ReadingType) => {
    const data = chartData.dataByType[type];
    const { min, max } = chartData.minMax[type];
    const range = max - min || 1;
    const color = TYPE_COLORS[type];
    const stepX = plotWidth > 0 ? plotWidth / 6 : 0;

    const points: { x: number; y: number }[] = [];
    data.forEach((value, i) => {
      if (value !== null) {
        const x = i * stepX;
        const y =
          CHART_HEIGHT - ((value - min) / range) * (CHART_HEIGHT - 20) - 10;
        points.push({ x, y });
      }
    });

    if (points.length < 2) {
      return points.map((p, i) => (
        <View
          key={`${type}-dot-${i}`}
          style={[
            styles.dot,
            {
              left: p.x - 4,
              top: p.y - 4,
              backgroundColor: color,
            },
          ]}
        />
      ));
    }

    return (
      <View key={type} style={StyleSheet.absoluteFill}>
        {points.map((p, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`${type}-line-${i}`}
              style={[
                styles.line,
                {
                  left: prev.x,
                  top: prev.y,
                  width: length,
                  backgroundColor: color,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />
          );
        })}
        {points.map((p, i) => (
          <View
            key={`${type}-dot-${i}`}
            style={[
              styles.dot,
              {
                left: p.x - 4,
                top: p.y - 4,
                backgroundColor: color,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.header}>
        <Feather name="bar-chart-2" size={18} color={colors.primary} />
        <ThemedText style={styles.title}>Compare Biomarkers</ThemedText>
      </View>

      <View style={styles.typeSelector}>
        {READING_TYPES.map((type) => {
          const isSelected = selectedTypes.includes(type);
          return (
            <Pressable
              key={type}
              onPress={() => toggleType(type)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${READING_CONFIG[type].label} on the chart`}
              style={[
                styles.typeChip,
                {
                  backgroundColor: isSelected
                    ? TYPE_COLORS[type]
                    : theme.backgroundDefault,
                  borderColor: isSelected
                    ? TYPE_COLORS[type]
                    : theme.textSecondary + "40",
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.typeLabel,
                  { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                ]}
              >
                {READING_CONFIG[type].label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.chartContainer}>
        <View
          style={styles.chart}
          collapsable={false}
          onLayout={(event) => {
            const nextWidth = event.nativeEvent.layout.width;
            if (nextWidth > 0 && Math.abs(nextWidth - plotWidth) > 1) {
              setPlotWidth(nextWidth);
            }
          }}
        >
          {selectedTypes.map((type) => renderLine(type))}
        </View>
        <View style={styles.xLabels}>
          {chartData.days.map((day, i) => (
            <ThemedText
              key={i}
              style={[styles.xLabel, { color: theme.textSecondary }]}
            >
              {day
                .toLocaleDateString(undefined, { weekday: "short" })
                .slice(0, 2)}
            </ThemedText>
          ))}
        </View>
      </View>

      {readings.filter((r) => selectedTypes.includes(r.type)).length === 0 ? (
        <View style={styles.noDataContainer}>
          <ThemedText
            style={[styles.noDataText, { color: theme.textSecondary }]}
          >
            No data for selected biomarkers in the last 7 days
          </ThemedText>
        </View>
      ) : null}
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
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  typeChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  chartContainer: {
    height: CHART_HEIGHT + 24,
  },
  chart: {
    height: CHART_HEIGHT,
    position: "relative",
  },
  line: {
    position: "absolute",
    height: 2,
    transformOrigin: "left center",
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  xLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  xLabel: {
    fontSize: 10,
    textAlign: "center",
    flex: 1,
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  noDataText: {
    fontSize: 12,
    textAlign: "center",
  },
});
