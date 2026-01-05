import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { AvatarSelector } from "@/components/AvatarSelector";
import { SettingsRow } from "@/components/SettingsRow";
import { Button } from "@/components/Button";
import { usePreferencesContext } from "@/context/PreferencesContext";
import { useReadingsContext } from "@/context/ReadingsContext";
import { clearAllData } from "@/lib/storage";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { preferences, updatePreferences, refresh: refreshPreferences } = usePreferencesContext();
  const { refresh: refreshReadings } = useReadingsContext();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(preferences.displayName);

  useEffect(() => {
    setTempName(preferences.displayName);
  }, [preferences.displayName]);

  const handleNameSave = () => {
    if (tempName.trim()) {
      updatePreferences({ displayName: tempName.trim() });
    } else {
      setTempName(preferences.displayName);
    }
    setEditingName(false);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your readings and preferences. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllData();
              await Promise.all([refreshPreferences(), refreshReadings()]);
              Alert.alert("Success", "All data has been cleared.");
            } catch (error) {
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <AvatarSelector
        selectedIndex={preferences.avatarIndex}
        onSelect={(index) => updatePreferences({ avatarIndex: index })}
        displayName={preferences.displayName}
      />

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={styles.sectionTitle}>Profile</ThemedText>
        {editingName ? (
          <View style={styles.nameInputContainer}>
            <TextInput
              value={tempName}
              onChangeText={setTempName}
              onBlur={handleNameSave}
              onSubmitEditing={handleNameSave}
              autoFocus
              style={[
                styles.nameInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                },
              ]}
              placeholder="Enter your name"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        ) : (
          <SettingsRow
            icon="user"
            label="Display Name"
            value={preferences.displayName}
            onPress={() => {
              setTempName(preferences.displayName);
              setEditingName(true);
            }}
          />
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
        <SettingsRow
          icon="droplet"
          label="Units"
          value={preferences.units}
          onPress={() => {
            const newUnit = preferences.units === "mg/dL" ? "mmol/L" : "mg/dL";
            updatePreferences({ units: newUnit });
          }}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="bell"
          label="Notifications"
          isSwitch
          switchValue={preferences.notificationsEnabled}
          onSwitchChange={(value) => updatePreferences({ notificationsEnabled: value })}
        />
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={styles.sectionTitle}>About</ThemedText>
        <SettingsRow
          icon="info"
          label="Version"
          value="1.0.0"
          showChevron={false}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="shield"
          label="Privacy Policy"
          onPress={() => {}}
        />
      </View>

      <View style={styles.dangerSection}>
        <Button
          onPress={handleClearData}
          style={{ backgroundColor: colors.error }}
        >
          Clear All Data
        </Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  nameInputContainer: {
    paddingVertical: Spacing.sm,
  },
  nameInput: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
  },
  dangerSection: {
    marginTop: Spacing.xl,
  },
});
