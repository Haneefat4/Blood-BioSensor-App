import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";

import type { DateTimeFieldProps } from "@/components/DateTimeField.types";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, MinTouchTarget, Spacing } from "@/constants/theme";

function formatValue(value: Date, mode: DateTimeFieldProps["mode"]): string {
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

export function DateTimeField({
  value,
  mode,
  onChange,
  label,
  accessibilityHint,
  maximumDate,
  minimumDate,
}: DateTimeFieldProps) {
  const { theme, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const display = formatValue(value, mode);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setOpen(false);
    }
    if (event.type === "dismissed" || !selected) return;
    onChange(selected);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${display}`}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.backgroundDefault,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
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
          <ThemedText style={styles.value}>{display}</ThemedText>
        </View>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value}
          mode={mode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          themeVariant={isDark ? "dark" : "light"}
        />
      ) : null}
      {open && Platform.OS === "ios" ? (
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={`Done choosing ${label}`}
          style={({ pressed }) => [styles.done, { opacity: pressed ? 0.7 : 1 }]}
        >
          <ThemedText type="link">Done</ThemedText>
        </Pressable>
      ) : null}
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
  value: {
    fontSize: 15,
    fontWeight: "600",
  },
  done: {
    minHeight: MinTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
