import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { sortTimes } from "@/lib/reminderTimes";
import type { UserPreferences } from "@/types";
import { READING_CONFIG } from "@/types";

export function configureNotificationHandler(): void {
  if (Platform.OS === "web") return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

let notificationQueue: Promise<void> = Promise.resolve();

function enqueueNotificationTask(task: () => Promise<void>): Promise<void> {
  const run = notificationQueue.then(task, task);
  notificationQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function cancelScheduledReminders(): Promise<void> {
  return enqueueNotificationTask(async () => {
    if (Platform.OS === "web") return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  });
}

/**
 * Replace the OS schedule so it matches preferences.
 * Reminders are scheduled only when the profile notifications switch is on
 * and reminder settings are enabled. Otherwise any existing schedule is cancelled.
 */
export function syncScheduledReminders(
  preferences: UserPreferences,
): Promise<void> {
  return enqueueNotificationTask(() => applyScheduledReminders(preferences));
}

async function applyScheduledReminders(
  preferences: UserPreferences,
): Promise<void> {
  if (Platform.OS === "web") return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = preferences.reminderSettings;
  if (!preferences.notificationsEnabled || !settings?.enabled) return;
  if (settings.times.length === 0 || settings.types.length === 0) return;

  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") return;

  const typeLabels = settings.types
    .map((type) => READING_CONFIG[type].label)
    .join(", ");

  for (const time of sortTimes(settings.times)) {
    const [hour, minute] = time.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Record Your Reading",
        body: `Don't forget to log your ${typeLabels} reading.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}
