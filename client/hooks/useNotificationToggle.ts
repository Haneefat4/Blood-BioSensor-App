import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { usePreferencesContext } from "@/context/PreferencesContext";
import { useFeedback } from "@/components/FeedbackProvider";
import { withLinkedNotifications } from "@/lib/notificationPrefs";
import { syncScheduledReminders } from "@/lib/reminders";
import * as Notifications from "expo-notifications";

/**
 * Profile and Reminders share one on/off switch. Turning it on requests
 * permission on a phone. The browser can store the choice but cannot deliver alerts.
 */
export function useNotificationToggle() {
  const { preferences, updatePreferences } = usePreferencesContext();
  const { notify } = useFeedback();

  const setEnabled = async (enabled: boolean) => {
    if (
      enabled === preferences.notificationsEnabled &&
      (preferences.reminderSettings?.enabled ?? false) === enabled
    ) {
      return;
    }

    void Haptics.selectionAsync();

    if (enabled && Platform.OS !== "web") {
      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== "granted") {
        status = (await Notifications.requestPermissionsAsync()).status;
      }
      if (status !== "granted") {
        notify({
          tone: "error",
          message:
            "Notifications stay off until they are allowed for this app.",
        });
        return;
      }
    }

    try {
      const next = await updatePreferences((current) => {
        const linked = withLinkedNotifications(current, enabled);
        return {
          notificationsEnabled: linked.notificationsEnabled,
          reminderSettings: linked.reminderSettings,
        };
      });
      await syncScheduledReminders(next);
      if (enabled) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      if (enabled && Platform.OS === "web") {
        notify(
          "Notifications are on for this log. This browser cannot deliver alerts. Use the iOS or Android app for those.",
        );
      } else if (enabled) {
        notify({ tone: "success", message: "Notifications are on." });
      } else {
        notify("Notifications are off.");
      }
    } catch {
      notify({
        tone: "error",
        message: "Could not update notifications. Please try again.",
      });
    }
  };

  return {
    enabled: preferences.notificationsEnabled,
    setEnabled,
  };
}
