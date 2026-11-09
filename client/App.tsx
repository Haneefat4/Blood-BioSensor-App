import React, { useEffect } from "react";
import { ActivityIndicator, Appearance, StyleSheet, View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FeedbackProvider } from "@/components/FeedbackProvider";
import { DisclaimerScreen } from "@/screens/DisclaimerScreen";
import { ReadingsProvider } from "@/context/ReadingsContext";
import {
  PreferencesProvider,
  usePreferencesContext,
} from "@/context/PreferencesContext";
import { MedicationsProvider } from "@/context/MedicationsContext";
import {
  notificationFlagsMatch,
  withLinkedNotifications,
} from "@/lib/notificationPrefs";
import {
  configureNotificationHandler,
  syncScheduledReminders,
} from "@/lib/reminders";
import { useDisclaimer } from "@/hooks/useDisclaimer";
import { useTheme } from "@/hooks/useTheme";
import { DEFAULT_USER_PREFERENCES } from "@/types";

configureNotificationHandler();

function ReminderSync() {
  const { preferences, isLoading, updatePreferences } = usePreferencesContext();
  const notificationsEnabled = preferences.notificationsEnabled;
  const reminderSettings = preferences.reminderSettings;

  useEffect(() => {
    if (isLoading || notificationFlagsMatch(preferences)) return;
    updatePreferences((current) => {
      if (notificationFlagsMatch(current)) return null;
      const linked = withLinkedNotifications(
        current,
        current.notificationsEnabled,
      );
      return {
        notificationsEnabled: linked.notificationsEnabled,
        reminderSettings: linked.reminderSettings,
      };
    }).catch((error) => {
      console.error("Error linking notification settings:", error);
    });
  }, [isLoading, preferences, updatePreferences]);

  useEffect(() => {
    if (isLoading) return;
    syncScheduledReminders({
      ...DEFAULT_USER_PREFERENCES,
      notificationsEnabled,
      reminderSettings,
    }).catch((error) => {
      console.error("Error syncing reminders:", error);
    });
  }, [isLoading, notificationsEnabled, reminderSettings]);

  return null;
}

function AppShell() {
  const { accepted, accept } = useDisclaimer();
  const { theme } = useTheme();

  if (accepted === null) {
    return (
      <View
        style={[
          styles.root,
          styles.centered,
          { backgroundColor: theme.backgroundRoot },
        ]}
        accessibilityLabel="Loading"
      >
        <ActivityIndicator color={theme.primary} />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!accepted) {
    return (
      <>
        <DisclaimerScreen onAccept={accept} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <>
      <ReminderSync />
      <ThemedNavigation />
    </>
  );
}

function ThemedNavigation() {
  const { preferences } = usePreferencesContext();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    const scheme =
      preferences.darkMode === "system" ? null : preferences.darkMode;
    try {
      Appearance.setColorScheme(scheme);
    } catch {
      // Some web runtimes do not allow overriding the color scheme.
    }
  }, [preferences.darkMode]);

  const base = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.backgroundRoot,
      card: theme.backgroundDefault,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <>
      <NavigationContainer theme={navigationTheme}>
        <RootStackNavigator />
      </NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <ReadingsProvider>
              <PreferencesProvider>
                <MedicationsProvider>
                  <FeedbackProvider>
                    <AppShell />
                  </FeedbackProvider>
                </MedicationsProvider>
              </PreferencesProvider>
            </ReadingsProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});
