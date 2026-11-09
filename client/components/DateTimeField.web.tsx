import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
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
  const next = new Date(current.getTime());
  next.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(next.getTime())) return null;
  return next;
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
  const [text, setText] = useState(toFieldValue(value, mode));
  const [focused, setFocused] = useState(false);
  const display = focused ? text : toFieldValue(value, mode);

  const commit = (nextText: string) => {
    const parsed = applyFieldValue(value, mode, nextText);
    if (!parsed) {
      setText(toFieldValue(value, mode));
      return;
    }
    if (maximumDate && parsed.getTime() > maximumDate.getTime()) {
      onChange(maximumDate);
      setText(toFieldValue(maximumDate, mode));
      return;
    }
    if (minimumDate && parsed.getTime() < minimumDate.getTime()) {
      onChange(minimumDate);
      setText(toFieldValue(minimumDate, mode));
      return;
    }
    onChange(parsed);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        style={[styles.button, { backgroundColor: theme.backgroundDefault }]}
      >
        <Feather
          name={mode === "time" ? "clock" : "calendar"}
          size={18}
          color={theme.text}
        />
        <View style={styles.copy}>
          <ThemedText style={[styles.caption, { color: theme.textSecondary }]}>
            {label}
          </ThemedText>
          <TextInput
            value={display}
            onChangeText={setText}
            onFocus={() => {
              setFocused(true);
              setText(toFieldValue(value, mode));
            }}
            onBlur={() => {
              setFocused(false);
              commit(text);
            }}
            onSubmitEditing={() => commit(text)}
            accessibilityLabel={`${label} value`}
            autoCorrect={false}
            autoCapitalize="none"
            placeholder={mode === "time" ? "HH:MM" : "YYYY-MM-DD"}
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  button: {
    minHeight: MinTouchTarget,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  copy: {
    flex: 1,
  },
  caption: {
    fontSize: 12,
  },
  input: {
    fontSize: 15,
    fontWeight: "600",
    padding: 0,
    minHeight: 22,
  },
});
