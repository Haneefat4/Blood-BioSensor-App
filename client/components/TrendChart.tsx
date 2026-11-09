import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { colorForSeverity } from "@/components/StatusBadge";
import { useTheme } from "@/hooks/useTheme";
import { useReadingDisplay } from "@/hooks/useReadingDisplay";
import { readingsInSevenDayWindow, sevenDayWindow } from "@/lib/readingOrder";
import { formatMeasurement } from "@/lib/units";
import {
  BorderRadius,
  MinTouchTarget,
  Spacing,
  Colors,
} from "@/constants/theme";
import type { Reading, ReadingStatus, ReadingType } from "@/types";
import { READING_CONFIG } from "@/types";

interface TrendChartProps {
  readings: Reading[];
  type: ReadingType;
}

const READING_TYPES: ReadingType[] = [
  "glucose",
  "hemoglobin",
  "cholesterol",
  "platelets",
];
const PLOT_HEIGHT = 120;

const SHAPE_LABEL: Record<ReadingStatus, string> = {
  normal: "In usual range",
  warning: "Outside usual range",
  critical: "Far outside usual range",
};

export function TrendChart({ readings, type }: TrendChartProps) {
  const { theme, isDark } = useTheme();
  const { units, unitText, assess } = useReadingDisplay();
  const colors = isDark ? Colors.dark : Colors.light;
  const [selectedType, setSelectedType] = useState<ReadingType>(type);
  const [plotWidth, setPlotWidth] = useState(0);
  const pickedType = useRef(false);
  const now = Date.now();

  useEffect(() => {
    if (!pickedType.current) {
      setSelectedType(type);
    }
  }, [type]);
  const window = sevenDayWindow(now);
  const series = readingsInSevenDayWindow(readings, selectedType, now);
  const typeLabel = READING_CONFIG[selectedType].label;
  const trendTitle = `7-day trend (${unitText(selectedType)})`;

  const values = series.map((reading) => reading.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 1;
  const range = maxValue - minValue || 1;
  const span = Math.max(window.end - window.start, 1);
  const pad = 10;
  const innerWidth = Math.max(plotWidth - pad * 2, 1);

  const points = series.map((reading) => {
    const severity = assess(reading).severity;
    return {
      x: pad + ((reading.timestamp - window.start) / span) * innerWidth,
      y:
        PLOT_HEIGHT -
        ((reading.value - minValue) / range) * (PLOT_HEIGHT - 24) -
        12,
      severity,
      color: colorForSeverity(severity, colors),
    };
  });

  const startLabel = new Date(window.start).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const summary =
    series.length === 0
      ? `No ${typeLabel} readings in the last 7 days.`
      : `${series.length} ${typeLabel} reading${series.length === 1 ? "" : "s"} from ${startLabel} through today.`;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      <ThemedText style={styles.title} accessibilityRole="header">
        {trendTitle}
      </ThemedText>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Reading type for the 7-day trend"
        style={styles.typeRow}
      >
        {READING_TYPES.map((option) => {
          const selected = option === selectedType;
          return (
            <Pressable
              key={option}
              onPress={() => {
                pickedType.current = true;
                setSelectedType(option);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={READING_CONFIG[option].label}
              style={({ pressed }) => [
                styles.typeChip,
                {
                  backgroundColor: selected
                    ? colors.primary
                    : theme.backgroundSecondary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText
                numberOfLines={1}
                style={[
                  styles.typeText,
                  { color: selected ? "#FFFFFF" : theme.text },
                ]}
              >
                {READING_CONFIG[option].label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText style={[styles.summary, { color: theme.textSecondary }]}>
        {summary}
      </ThemedText>

      {series.length === 0 ? (
        <View style={styles.emptyChart}>
          <Feather name="trending-up" size={28} color={theme.textSecondary} />
          <ThemedText
            style={[styles.emptyText, { color: theme.textSecondary }]}
          >
            Readings from the last 7 days will appear here.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.chartRow}>
          <View style={styles.yAxis}>
            <ThemedText
              maxFontSizeMultiplier={1.4}
              style={[styles.axisLabel, { color: theme.textSecondary }]}
            >
              {formatMeasurement(selectedType, maxValue, units)}
            </ThemedText>
            <ThemedText
              maxFontSizeMultiplier={1.4}
              style={[styles.axisLabel, { color: theme.textSecondary }]}
            >
              {formatMeasurement(selectedType, minValue, units)}
            </ThemedText>
          </View>
          <View
            style={styles.plot}
            collapsable={false}
            onLayout={(event) => {
              const nextWidth = event.nativeEvent.layout.width;
              if (nextWidth > 0 && Math.abs(nextWidth - plotWidth) > 1) {
                setPlotWidth(nextWidth);
              }
            }}
          >
            <View
              style={[
                styles.gridLine,
                { backgroundColor: theme.border, top: 12 },
              ]}
            />
            <View
              style={[
                styles.gridLine,
                { backgroundColor: theme.border, bottom: 12 },
              ]}
            />
            {plotWidth > 0
              ? points.slice(0, -1).map((point, index) => {
                  const nextPoint = points[index + 1];
                  if (!nextPoint) return null;
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
                          left: point.x,
                          top: point.y,
                          width: length,
                          backgroundColor: colors.primary,
                          transform: [{ rotate: `${angle}deg` }],
                        },
                      ]}
                    />
                  );
                })
              : null}
            {plotWidth > 0
              ? points.map((point, index) => (
                  <View
                    key={`dot-${index}`}
                    accessibilityLabel={`${READING_CONFIG[selectedType].label} point, ${SHAPE_LABEL[point.severity]}`}
                    style={[
                      styles.dot,
                      point.severity === "warning" ? styles.square : null,
                      point.severity === "critical" ? styles.diamond : null,
                      {
                        left: point.x - 5,
                        top: point.y - 5,
                        backgroundColor: point.color,
                      },
                    ]}
                  />
                ))
              : null}
          </View>
        </View>
      )}

      <View style={styles.axisEnds}>
        <ThemedText
          maxFontSizeMultiplier={1.4}
          style={[styles.axisLabel, { color: theme.textSecondary }]}
        >
          {startLabel}
        </ThemedText>
        <ThemedText
          maxFontSizeMultiplier={1.4}
          style={[styles.axisLabel, { color: theme.textSecondary }]}
        >
          Today
        </ThemedText>
      </View>

      <View style={styles.legend} accessibilityLabel="Trend marker legend">
        {(Object.keys(SHAPE_LABEL) as ReadingStatus[]).map((severity) => (
          <View key={severity} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                severity === "warning" ? styles.square : null,
                severity === "critical" ? styles.diamond : null,
                { backgroundColor: colorForSeverity(severity, colors) },
              ]}
            />
            <ThemedText
              style={[styles.legendText, { color: theme.textSecondary }]}
            >
              {SHAPE_LABEL[severity]}
            </ThemedText>
          </View>
        ))}
      </View>
      {series.length === 1 ? (
        <ThemedText style={[styles.summary, { color: theme.textSecondary }]}>
          Add another reading in this 7-day window to draw a line.
        </ThemedText>
      ) : null}
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
    marginBottom: Spacing.md,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeChip: {
    minHeight: MinTouchTarget,
    minWidth: MinTouchTarget,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  typeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  chartRow: {
    flexDirection: "row",
    height: PLOT_HEIGHT,
  },
  yAxis: {
    width: 52,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  axisLabel: {
    fontSize: 11,
  },
  plot: {
    flex: 1,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  dot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  square: {
    borderRadius: 2,
  },
  diamond: {
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
  },
  line: {
    position: "absolute",
    height: 2,
    transformOrigin: "left center",
  },
  axisEnds: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 52,
    marginTop: Spacing.xs,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  emptyChart: {
    height: PLOT_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
