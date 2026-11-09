import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  TextInput,
  Pressable,
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
import {
  Spacing,
  BorderRadius,
  Colors,
  MinTouchTarget,
} from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useFeedback } from "@/components/FeedbackProvider";
import { usePreferencesContext } from "@/context/PreferencesContext";
import { useNotificationToggle } from "@/hooks/useNotificationToggle";
import { withLinkedNotifications } from "@/lib/notificationPrefs";
import { normalizeTime, sortTimes } from "@/lib/reminderTimes";
import { syncScheduledReminders } from "@/lib/reminders";
import type { ReadingType } from "@/types";
import { READING_CONFIG } from "@/types";

const READING_TYPES: ReadingType[] = [
  "glucose",
  "hemoglobin",
  "cholesterol",
  "platelets",
];

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { preferences, isLoading, updatePreferences } = usePreferencesContext();
  const { notify } = useFeedback();
  const { enabled: remindersOn, setEnabled: setRemindersOn } =
    useNotificationToggle();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [times, setTimes] = useState<string[]>(["09:00", "21:00"]);
  const [selectedTypes, setSelectedTypes] = useState<ReadingType[]>([
    "glucose",
  ]);
  const [newTime, setNewTime] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    checkPermission();
  }, []);

  useEffect(() => {
    if (isLoading || hydrated.current) return;
    hydrated.current = true;
    const settings = preferences.reminderSettings;
    setTimes(
      sortTimes(settings?.times?.length ? settings.times : ["09:00", "21:00"]),
    );
    setSelectedTypes(settings?.types?.length ? settings.types : ["glucose"]);
    setDraftReady(true);
  }, [isLoading, preferences.reminderSettings]);

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
      const message =
        "This browser cannot send reminder alerts. Allow notifications in the iOS or Android app. Reminder times saved here still apply on that app.";
      setStatusText(message);
      notify(message);
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";
    setHasPermission(granted);
    if (granted) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const message = "Notifications are allowed.";
      setStatusText(message);
      notify({ tone: "success", message });
      if (preferences.notificationsEnabled) {
        await syncScheduledReminders(preferences);
      }
      return;
    }
    const message =
      "Notifications were not allowed. You can turn them on in the system settings.";
    setStatusText(message);
    notify({ tone: "error", message });
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
    const normalized = normalizeTime(newTime);
    if (!normalized) {
      const message = "Enter a time as HH:MM, for example 09:00 or 21:30.";
      setStatusText(message);
      notify({ tone: "error", message });
      return;
    }
    if (times.includes(normalized)) {
      const message = "That time is already in the list.";
      setStatusText(message);
      notify(message);
      return;
    }
    setTimes((prev) => sortTimes([...prev, normalized]));
    setNewTime("");
    Haptics.selectionAsync();
  };

  const removeTime = (time: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimes((prev) => prev.filter((t) => t !== time));
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const normalizedTimes = sortTimes(times);
      const next = await updatePreferences((current) => {
        const linked = withLinkedNotifications(
          {
            ...current,
            reminderSettings: {
              enabled: current.notificationsEnabled,
              times: normalizedTimes,
              types: selectedTypes,
            },
          },
          current.notificationsEnabled,
        );
        return {
          notificationsEnabled: linked.notificationsEnabled,
          reminderSettings: linked.reminderSettings,
        };
      });
      await syncScheduledReminders(next);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const message =
        next.notificationsEnabled && Platform.OS === "web"
          ? "Reminder times saved. Alerts are sent by the iOS or Android app, not this browser."
          : next.notificationsEnabled && hasPermission === false
            ? "Reminder times saved. Allow notifications on this phone before alerts can be scheduled."
            : "Reminder times saved.";
      setStatusText(message);
      notify({ tone: "success", message });
    } catch {
      const message = "Could not save reminders. Please try again.";
      setStatusText(message);
      notify({ tone: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!draftReady) {
    return (
      <View
        style={[
          styles.container,
          styles.loading,
          { backgroundColor: theme.backgroundRoot },
        ]}
        accessibilityLabel="Loading saved reminders"
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

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
            Push notifications are delivered by the iOS or Android app. Reminder
            times you save here are kept on this device.
          </ThemedText>
        </View>
      ) : null}

      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Enable Reminders</ThemedText>
          <Switch
            value={remindersOn}
            accessibilityLabel="Enable reminders"
            onValueChange={(value) => {
              void setRemindersOn(value);
            }}
            trackColor={{
              false: theme.border,
              true: colors.primary + "80",
            }}
            thumbColor={
              remindersOn ? colors.primary : theme.backgroundSecondary
            }
          />
        </View>

        {preferences.reminderSettings?.enabled &&
        !preferences.notificationsEnabled ? (
          <ThemedText
            style={[styles.pausedText, { color: theme.textSecondary }]}
          >
            Reminders are paused while notifications are off. Turn notifications
            on in Profile to restore this schedule.
          </ThemedText>
        ) : null}

        {!hasPermission && remindersOn ? (
          <Pressable
            onPress={requestPermission}
            accessibilityRole="button"
            accessibilityLabel="Allow notifications"
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
            opacity: remindersOn ? 1 : 0.5,
          },
        ]}
      >
        <ThemedText style={styles.sectionTitle}>Reminder Times</ThemedText>
        <View style={styles.timesContainer}>
          {sortTimes(times).map((time) => (
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
              <Pressable
                onPress={() => removeTime(time)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${time}`}
                style={styles.removeTimeBtn}
              >
                <Feather name="x" size={16} color={colors.primary} />
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.addTimeRow}>
          <TextInput
            value={newTime}
            onChangeText={setNewTime}
            accessibilityLabel="New reminder time"
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
            accessibilityRole="button"
            accessibilityLabel="Add reminder time"
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
            opacity: remindersOn ? 1 : 0.5,
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
                disabled={!remindersOn}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: isSelected,
                  disabled: !remindersOn,
                }}
                accessibilityLabel={READING_CONFIG[type].label}
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
        {statusText ? (
          <ThemedText
            accessibilityLiveRegion="polite"
            style={[styles.statusText, { color: theme.text }]}
          >
            {statusText}
          </ThemedText>
        ) : null}
        <Button onPress={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Reminders"}
        </Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
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
    minHeight: MinTouchTarget,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  permissionBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pausedText: {
    fontSize: 14,
    marginTop: Spacing.md,
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
    minHeight: MinTouchTarget,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  removeTimeBtn: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: "center",
    justifyContent: "center",
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
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  saveContainer: {
    marginTop: Spacing.lg,
  },
  statusText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
});
