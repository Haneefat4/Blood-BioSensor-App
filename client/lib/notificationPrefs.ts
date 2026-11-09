import type { UserPreferences } from "@/types";
import { DEFAULT_USER_PREFERENCES } from "@/types";

const DEFAULT_TIMES = DEFAULT_USER_PREFERENCES.reminderSettings?.times ?? [
  "09:00",
  "21:00",
];
const DEFAULT_TYPES = DEFAULT_USER_PREFERENCES.reminderSettings?.types ?? [
  "glucose",
];

/**
 * Profile "Notifications" and Reminders "Enable Reminders" are one setting.
 * They match when both stored flags are on or both are off.
 */
export function notificationFlagsMatch(preferences: UserPreferences): boolean {
  return (
    preferences.notificationsEnabled ===
    (preferences.reminderSettings?.enabled ?? false)
  );
}

/** Write the same on/off value to both notification flags, keeping the schedule. */
export function withLinkedNotifications(
  preferences: UserPreferences,
  enabled: boolean,
): UserPreferences {
  const current = preferences.reminderSettings;
  return {
    ...preferences,
    notificationsEnabled: enabled,
    reminderSettings: {
      enabled,
      times: current?.times?.length ? [...current.times] : [...DEFAULT_TIMES],
      types: current?.types?.length ? [...current.types] : [...DEFAULT_TYPES],
    },
  };
}
