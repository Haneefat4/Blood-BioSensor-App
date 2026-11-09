import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors } from "@/constants/theme";

interface AvatarSelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  displayName: string;
}

const AVATARS = [
  { icon: "activity" as const, color: "#2563EB", label: "Activity" },
  { icon: "heart" as const, color: "#EF4444", label: "Heart" },
  { icon: "user" as const, color: "#14B8A6", label: "Person" },
  { icon: "shield" as const, color: "#8B5CF6", label: "Shield" },
];

export function AvatarSelector({
  selectedIndex,
  onSelect,
  displayName,
}: AvatarSelectorProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const selectedAvatar = AVATARS[selectedIndex] || AVATARS[0];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.mainAvatar,
          { backgroundColor: selectedAvatar.color + "20" },
        ]}
      >
        <Feather
          name={selectedAvatar.icon}
          size={48}
          color={selectedAvatar.color}
        />
      </View>
      <ThemedText style={styles.name}>{displayName}</ThemedText>
      <View style={styles.selectorRow} accessibilityRole="radiogroup">
        {AVATARS.map((avatar, index) => (
          <Pressable
            key={avatar.label}
            onPress={() => onSelect(index)}
            accessibilityRole="radio"
            accessibilityLabel={`${avatar.label} avatar`}
            accessibilityState={{ selected: index === selectedIndex }}
            style={({ pressed }) => [
              styles.avatarOption,
              {
                backgroundColor: avatar.color + "20",
                borderColor:
                  index === selectedIndex ? colors.primary : "transparent",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name={avatar.icon} size={24} color={avatar.color} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  mainAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  selectorRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});
