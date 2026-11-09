import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { usePreferencesContext } from "@/context/PreferencesContext";
import type { ReadingType } from "@/types";
import { READING_CONFIG } from "@/types";

const READING_TYPES: ReadingType[] = [
  "glucose",
  "hemoglobin",
  "cholesterol",
  "platelets",
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { preferences, updatePreferences } = usePreferencesContext();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(
    preferences.reminderSettings?.enabled || false,
  );
  const [times, setTimes] = useState<string[]>(
    preferences.reminderSettings?.times || ["09:00", "21:00"],
  );
  const [selectedTypes, setSelectedTypes] = useState<ReadingType[]>(
    preferences.reminderSettings?.types || ["glucose"],
  );
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS === "web") {
      setHasPermission(false);
      return;
    }
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const requestPermission = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "Push notifications require Expo Go. Run this app on your device to use this feature.",
      );
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === "granted");
    if (status === "granted") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

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

  const addTime = () => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(newTime)) {
      Alert.alert(
        "Invalid Time",
        "Please enter time in HH:MM format (e.g., 09:00 or 21:30).",
      );
      return;
    }
    if (times.includes(newTime)) {
      Alert.alert("Duplicate", "This time is already added.");
      return;
    }
    setTimes((prev) => [...prev, newTime].sort());
    setNewTime("");
    Haptics.selectionAsync();
  };

  const removeTime = (time: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimes((prev) => prev.filter((t) => t !== time));
  };

  const handleSave = async () => {
    if (enabled && !hasPermission) {
      Alert.alert("Permission Required", "Please enable notifications first.");
      return;
    }

    await updatePreferences({
      reminderSettings: {
        enabled,
        times,
        types: selectedTypes,
      },
    });

    if (enabled && hasPermission) {
      await scheduleNotifications();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved", "Your reminder settings have been saved.");
  };

  const scheduleNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!enabled || times.length === 0) return;

    for (const time of times) {
      const [hours, minutes] = time.split(":").map(Number);
      const typeLabels = selectedTypes
        .map((t) => READING_CONFIG[t].label)
        .join(", ");

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to Record Your Reading",
          body: `Don't forget to log your ${typeLabels} reading.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      {Platform.OS === "web" ? (
        <View
          style={[styles.webNotice, { backgroundColor: colors.warning + "20" }]}
        >
          <Feather name="alert-circle" size={20} color={colors.warning} />
          <ThemedText style={[styles.webNoticeText, { color: colors.warning }]}>
            Push notifications require Expo Go on your mobile device.
          </ThemedText>
        </View>
      ) : null}

      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Enable Reminders</ThemedText>
          <Switch
            value={enabled}
            onValueChange={(val) => {
              Haptics.selectionAsync();
              setEnabled(val);
            }}
            trackColor={{ false: theme.border, true: colors.primary + "80" }}
            thumbColor={enabled ? colors.primary : theme.backgroundSecondary}
          />
        </View>

        {!hasPermission && enabled ? (
          <Pressable
            onPress={requestPermission}
            style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="bell" size={16} color="#FFFFFF" />
            <ThemedText style={styles.permissionBtnText}>
              Allow Notifications
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.backgroundDefault,
            opacity: enabled ? 1 : 0.5,
          },
        ]}
      >
        <ThemedText style={styles.sectionTitle}>Reminder Times</ThemedText>
        <View style={styles.timesContainer}>
          {times.map((time) => (
            <View
              key={time}
              style={[
                styles.timeChip,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Feather name="clock" size={14} color={colors.primary} />
              <ThemedText style={[styles.timeText, { color: colors.primary }]}>
                {time}
              </ThemedText>
              <Pressable onPress={() => removeTime(time)} hitSlop={8}>
                <Feather name="x" size={14} color={colors.primary} />
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.addTimeRow}>
          <TextInput
            value={newTime}
            onChangeText={setNewTime}
            placeholder="HH:MM"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numbers-and-punctuation"
            style={[
              styles.timeInput,
              { backgroundColor: theme.backgroundSecondary, color: theme.text },
            ]}
          />
          <Pressable
            onPress={addTime}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.backgroundDefault,
            opacity: enabled ? 1 : 0.5,
          },
        ]}
      >
        <ThemedText style={styles.sectionTitle}>
          Reading Types to Remind
        </ThemedText>
        <View style={styles.typesGrid}>
          {READING_TYPES.map((type) => {
            const isSelected = selectedTypes.includes(type);
            return (
              <Pressable
                key={type}
                onPress={() => toggleType(type)}
                disabled={!enabled}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : theme.backgroundSecondary,
                  },
                ]}
              >
                <Feather
                  name={READING_CONFIG[type].icon as any}
                  size={16}
                  color={isSelected ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  style={{
                    color: isSelected ? "#FFFFFF" : theme.text,
                    fontWeight: "500",
                  }}
                >
                  {READING_CONFIG[type].label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.saveContainer}>
        <Button onPress={handleSave}>Save Reminders</Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  webNoticeText: {
    flex: 1,
    fontSize: 14,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  permissionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  permissionBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  timesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  timeText: {
    fontWeight: "600",
  },
  addTimeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  timeInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    fontSize: 16,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  typesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  saveContainer: {
    marginTop: Spacing.lg,
  },
});
