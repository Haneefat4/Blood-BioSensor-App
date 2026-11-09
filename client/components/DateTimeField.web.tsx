import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import type { DateTimeFieldProps } from "@/components/DateTimeField.types";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, MinTouchTarget, Spacing } from "@/constants/theme";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toFieldValue(value: Date, mode: DateTimeFieldProps["mode"]): string {
  if (mode === "time") {
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function formatDisplay(value: Date, mode: DateTimeFieldProps["mode"]): string {
  if (mode === "time") {
    return value.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return value.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function applyFieldValue(
  current: Date,
  mode: DateTimeFieldProps["mode"],
  text: string,
): Date | null {
  if (mode === "time") {
    const match = /^(\d{2}):(\d{2})$/.exec(text);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    const next = new Date(current.getTime());
    next.setHours(hours, minutes, 0, 0);
    return next;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const next = new Date(current.getTime());
  next.setFullYear(year, month - 1, day);
  if (
    next.getFullYear() !== year ||
    next.getMonth() !== month - 1 ||
    next.getDate() !== day
  ) {
    return null;
  }
  return next;
}

interface WebInputProps {
  type: "date" | "time";
  value: string;
  min?: string;
  max?: string;
  step?: number;
  "aria-label": string;
  title?: string;
  onChange: (event: { currentTarget: { value: string } }) => void;
  onFocus: () => void;
  onBlur: () => void;
  style: {
    position: "absolute";
    top: number;
    left: number;
    width: "100%";
    height: "100%";
    opacity: number;
    cursor: "pointer";
    fontSize: number;
  };
}

function WebInput(props: WebInputProps) {
  return React.createElement("input", props);
}

export function DateTimeField({
  value,
  mode,
  onChange,
  label,
  accessibilityHint,
  maximumDate,
  minimumDate,
}: DateTimeFieldProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const display = formatDisplay(value, mode);
  const fieldValue = toFieldValue(value, mode);

  const commit = (text: string) => {
    const parsed = applyFieldValue(value, mode, text);
    if (!parsed) return;
    if (maximumDate && parsed.getTime() > maximumDate.getTime()) {
      onChange(new Date(maximumDate.getTime()));
      return;
    }
    if (minimumDate && parsed.getTime() < minimumDate.getTime()) {
      onChange(new Date(minimumDate.getTime()));
      return;
    }
    onChange(parsed);
  };

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.button,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: focused ? theme.link : "transparent",
          },
        ]}
      >
        <Feather
          name={mode === "time" ? "clock" : "calendar"}
          size={18}
          color={theme.text}
        />
        <View style={styles.copy} pointerEvents="none">
          <ThemedText style={[styles.caption, { color: theme.textSecondary }]}>
            {label}
          </ThemedText>
          <ThemedText style={styles.value}>{display}</ThemedText>
        </View>
        <WebInput
          type={mode === "time" ? "time" : "date"}
          value={fieldValue}
          min={minimumDate ? toFieldValue(minimumDate, mode) : undefined}
          max={maximumDate ? toFieldValue(maximumDate, mode) : undefined}
          step={mode === "time" ? 60 : undefined}
          aria-label={`${label}, ${display}`}
          title={accessibilityHint}
          onChange={(event) => commit(event.currentTarget.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={inputStyle}
        />
      </View>
    </View>
  );
}

const inputStyle = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%" as const,
  height: "100%" as const,
  opacity: 0,
  cursor: "pointer" as const,
  fontSize: 16,
  border: "none",
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  button: {
    minHeight: MinTouchTarget,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    position: "relative",
    overflow: "hidden",
  },
  copy: {
    flex: 1,
  },
  caption: {
    fontSize: 12,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
  },
});
