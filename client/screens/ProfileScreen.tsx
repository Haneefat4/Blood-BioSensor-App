import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Notifications from "expo-notifications";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { AvatarSelector } from "@/components/AvatarSelector";
import { SettingsRow } from "@/components/SettingsRow";
import { Button } from "@/components/Button";
import { usePreferencesContext } from "@/context/PreferencesContext";
import { useReadingsContext } from "@/context/ReadingsContext";
import { useMedicationsContext } from "@/context/MedicationsContext";
import { clearAllData } from "@/lib/storage";
import { buildReadingsCsv, buildReadingsPdfHtml } from "@/lib/exportFormat";
import { isShareCancelled, shareTextFile } from "@/lib/shareFile";
import { syncScheduledReminders } from "@/lib/reminders";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import type { ReferenceSex, UserPreferences } from "@/types";

const SEX_OPTIONS: { value: ReferenceSex; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "unspecified", label: "Not specified" },
];

const APPEARANCE_OPTIONS: {
  value: UserPreferences["darkMode"];
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { value: "system", label: "System", icon: "smartphone" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<ProfileNav>();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const {
    preferences,
    isLoading,
    updatePreferences,
    refresh: refreshPreferences,
  } = usePreferencesContext();
  const { readings, refresh: refreshReadings } = useReadingsContext();
  const { refresh: refreshMedications } = useMedicationsContext();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(preferences.displayName);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!editingName) {
      setTempName(preferences.displayName);
    }
  }, [preferences.displayName, editingName]);

  const handleNameSave = () => {
    if (tempName.trim()) {
      updatePreferences({ displayName: tempName.trim() });
    } else {
      setTempName(preferences.displayName);
    }
    setEditingName(false);
  };

  const handleExportCSV = async () => {
    if (readings.length === 0) {
      Alert.alert("No Data", "There are no readings to export.");
      return;
    }

    setIsExporting(true);
    try {
      const csv = buildReadingsCsv(readings, {
        units: preferences.units,
        sex: preferences.referenceSex,
      });
      const day = new Date().toISOString().slice(0, 10);
      await shareTextFile(`blood-biosensor-log-${day}.csv`, csv, "text/csv");
    } catch (error) {
      if (!isShareCancelled(error)) {
        Alert.alert("Error", "Failed to export data.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (readings.length === 0) {
      Alert.alert("No Data", "There are no readings to export.");
      return;
    }

    setIsExporting(true);
    try {
      const html = buildReadingsPdfHtml({
        displayName: preferences.displayName,
        readings,
        units: preferences.units,
        sex: preferences.referenceSex,
      });

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Blood Biosensor log",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", "PDF saved to: " + uri);
      }
    } catch (error) {
      if (!isShareCancelled(error)) {
        Alert.alert("Error", "Failed to generate PDF.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleNotificationsChange = async (value: boolean) => {
    if (
      value &&
      preferences.reminderSettings?.enabled &&
      Platform.OS !== "web"
    ) {
      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== "granted") {
        status = (await Notifications.requestPermissionsAsync()).status;
      }
      if (status !== "granted") {
        Alert.alert(
          "Notifications Disabled",
          "Allow notifications to restore your measurement reminders.",
        );
        return;
      }
    }

    const next = { ...preferences, notificationsEnabled: value };
    await updatePreferences({ notificationsEnabled: value });
    await syncScheduledReminders(next);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your readings, medications, and preferences. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllData();
              await Promise.all([
                refreshPreferences(),
                refreshReadings(),
                refreshMedications(),
              ]);
              Alert.alert("Success", "All data has been cleared.");
            } catch {
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.loading,
          { backgroundColor: theme.backgroundRoot },
        ]}
        accessibilityLabel="Loading saved preferences"
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

      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
        <ThemedText style={styles.sectionTitle}>Profile</ThemedText>
        {editingName ? (
          <View style={styles.nameInputContainer}>
            <TextInput
              value={tempName}
              onChangeText={setTempName}
              accessibilityLabel="Display name"
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

      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
        <ThemedText style={styles.sectionTitle}>Health Tracking</ThemedText>
        <SettingsRow
          icon="plus-circle"
          label="My Medications"
          onPress={() => navigation.navigate("Medications")}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="bell"
          label="Measurement Reminders"
          onPress={() => navigation.navigate("Reminders")}
        />
      </View>

      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
        <ThemedText style={styles.sectionTitle}>Export Data</ThemedText>
        <SettingsRow
          icon="file-text"
          label="Export as PDF"
          onPress={handleExportPDF}
          value={isExporting ? "Exporting..." : undefined}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="download"
          label="Export as CSV"
          onPress={handleExportCSV}
          value={isExporting ? "Exporting..." : undefined}
        />
      </View>

      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
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
        <ThemedText style={[styles.unitsHint, { color: theme.textSecondary }]}>
          Applies to glucose and cholesterol. Hemoglobin and platelets keep
          their own units.
        </ThemedText>
        <ThemedText style={styles.fieldLabel}>Hemoglobin range</ThemedText>
        <View style={styles.appearanceRow}>
          {SEX_OPTIONS.map((option) => {
            const selected = preferences.referenceSex === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  updatePreferences({ referenceSex: option.value })
                }
                accessibilityRole="button"
                accessibilityLabel={`${option.label} hemoglobin range`}
                accessibilityState={{ selected }}
                style={[
                  styles.appearanceOption,
                  {
                    backgroundColor: selected
                      ? colors.primary
                      : theme.backgroundSecondary,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.appearanceLabel,
                    { color: selected ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <ThemedText style={[styles.choiceHint, { color: theme.textSecondary }]}>
          Female and male use typical adult ranges. Not specified uses a
          combined range. This does not change other reading types.
        </ThemedText>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="bell"
          label="Notifications"
          isSwitch
          switchValue={preferences.notificationsEnabled}
          onSwitchChange={handleNotificationsChange}
        />
      </View>

      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
        <ThemedText style={styles.sectionTitle}>Display</ThemedText>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((option) => {
            const selected = preferences.darkMode === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => updatePreferences({ darkMode: option.value })}
                accessibilityRole="radio"
                accessibilityLabel={`${option.label} appearance`}
                accessibilityState={{ selected }}
                style={[
                  styles.appearanceOption,
                  {
                    backgroundColor: selected
                      ? colors.primary
                      : theme.backgroundSecondary,
                  },
                ]}
              >
                <Feather
                  name={option.icon}
                  size={16}
                  color={selected ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  style={[
                    styles.appearanceLabel,
                    { color: selected ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
      >
        <ThemedText style={styles.sectionTitle}>About</ThemedText>
        <SettingsRow
          icon="info"
          label="About"
          onPress={() => navigation.navigate("About")}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="shield"
          label="Privacy Policy"
          onPress={() => navigation.navigate("PrivacyPolicy")}
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
  loading: {
    alignItems: "center",
    justifyContent: "center",
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
  unitsHint: {
    fontSize: 13,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  choiceHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  appearanceRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  appearanceOption: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  appearanceLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  dangerSection: {
    marginTop: Spacing.xl,
  },
});
