import React from "react";
import { View, StyleSheet, Pressable, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { MinTouchTarget, Spacing, Colors } from "@/constants/theme";

interface SettingsRowProps {
  icon?: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  showChevron?: boolean;
}

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  isSwitch,
  switchValue,
  onSwitchChange,
  showChevron = true,
}: SettingsRowProps) {
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const content = (
    <View style={styles.container}>
      {icon ? (
        <Feather
          name={icon}
          size={20}
          color={colors.primary}
          style={styles.icon}
        />
      ) : null}
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.rightContent}>
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            accessibilityLabel={label}
            trackColor={{
              false: theme.backgroundSecondary,
              true: colors.primary,
            }}
            thumbColor="#FFFFFF"
          />
        ) : (
          <>
            {value ? (
              <ThemedText
                style={[styles.value, { color: theme.textSecondary }]}
              >
                {value}
              </ThemedText>
            ) : null}
            {showChevron && onPress ? (
              <Feather
                name="chevron-right"
                size={20}
                color={theme.textSecondary}
              />
            ) : null}
          </>
        )}
      </View>
    </View>
  );

  if (onPress && !isSwitch) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}, ${value}` : label}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          minHeight: MinTouchTarget,
        })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    minHeight: 48,
  },
  icon: {
    marginRight: Spacing.md,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  value: {
    fontSize: 14,
  },
});
