import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  TextInput,
  Platform,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useNotificationToggle } from "@/hooks/useNotificationToggle";
import { useFeedback } from "@/components/FeedbackProvider";
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
import {
  isShareCancelled,
  sharePdfReport,
  shareTextFile,
} from "@/lib/shareFile";
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
  const { notify, confirm } = useFeedback();
  const { enabled: notificationsOn, setEnabled: setNotifications } =
    useNotificationToggle();
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
      notify("There are no readings to export.");
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
      if (Platform.OS === "web") {
        notify({ tone: "success", message: "CSV downloaded." });
      }
    } catch (error) {
      if (!isShareCancelled(error)) {
        notify({
          tone: "error",
          message: "Could not export the CSV. Please try again.",
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (readings.length === 0) {
      notify("There are no readings to export.");
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
      const day = new Date().toISOString().slice(0, 10);
      const result = await sharePdfReport(
        `blood-biosensor-log-${day}.pdf`,
        html,
      );
      if (result === "printed") {
        notify(
          "Your report opened in a new tab. Choose Save as PDF in the print dialog.",
        );
      } else if (result === "html") {
        notify(
          "The report tab was blocked, so the report downloaded as HTML. Open that file, then choose Print and Save as PDF.",
        );
      }
    } catch (error) {
      if (!isShareCancelled(error)) {
        notify({
          tone: "error",
          message: "Could not create the PDF. Please try again.",
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = async () => {
    const confirmed = await confirm({
      title: "Clear All Data",
      message:
        "This will permanently delete all your readings, medications, and preferences. This action cannot be undone.",
      confirmLabel: "Clear Data",
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await clearAllData();
      await Promise.all([
        refreshPreferences(),
        refreshReadings(),
        refreshMedications(),
      ]);
      notify({ tone: "success", message: "All data has been cleared." });
    } catch {
      notify({
        tone: "error",
        message: "Could not clear data. Please try again.",
      });
    }
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
          switchValue={notificationsOn}
          onSwitchChange={setNotifications}
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
