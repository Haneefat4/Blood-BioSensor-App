import React, { useEffect } from "react";
import { Appearance, StyleSheet } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ReadingsProvider } from "@/context/ReadingsContext";
import {
  PreferencesProvider,
  usePreferencesContext,
} from "@/context/PreferencesContext";
import { MedicationsProvider } from "@/context/MedicationsContext";
import {
  configureNotificationHandler,
  syncScheduledReminders,
} from "@/lib/reminders";
import { useTheme } from "@/hooks/useTheme";
import { DEFAULT_USER_PREFERENCES } from "@/types";

configureNotificationHandler();

function ReminderSync() {
  const { preferences, isLoading } = usePreferencesContext();
  const notificationsEnabled = preferences.notificationsEnabled;
  const reminderSettings = preferences.reminderSettings;

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
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <ReadingsProvider>
                <PreferencesProvider>
                  <MedicationsProvider>
                    <ReminderSync />
                    <ThemedNavigation />
                  </MedicationsProvider>
                </PreferencesProvider>
              </ReadingsProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
