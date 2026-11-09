import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { DateTimeField } from "@/components/DateTimeField";
import { useTheme } from "@/hooks/useTheme";
import {
  Spacing,
  BorderRadius,
  Colors,
  MinTouchTarget,
} from "@/constants/theme";
import { startOfLocalDay } from "@/lib/readingOrder";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useReadingsContext } from "@/context/ReadingsContext";
import { usePreferencesContext } from "@/context/PreferencesContext";
import { displayUnitFor } from "@/lib/units";
import { formatUsualRange } from "@/lib/referenceRanges";
import { validateReadingInput } from "@/lib/readingValue";
import { ReferenceRangeNote } from "@/components/ReferenceRangeNote";
import type { ReadingType, ReadingTag } from "@/types";
import { READING_CONFIG, READING_TAGS } from "@/types";

const READING_TYPES: ReadingType[] = [
  "glucose",
  "hemoglobin",
  "cholesterol",
  "platelets",
];

export default function AddReadingScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const navigation = useNavigation();
  const { addReading } = useReadingsContext();
  const { preferences } = usePreferencesContext();

  const [selectedType, setSelectedType] = useState<ReadingType>("glucose");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [isFasting, setIsFasting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<ReadingTag[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(() => Date.now());
  const [isSaving, setIsSaving] = useState(false);

  const applyDate = (picked: Date) => {
    setTimestamp((current) => {
      const next = new Date(current);
      next.setFullYear(
        picked.getFullYear(),
        picked.getMonth(),
        picked.getDate(),
      );
      return Math.min(next.getTime(), Date.now());
    });
  };

  const applyTime = (picked: Date) => {
    setTimestamp((current) => {
      const next = new Date(current);
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      return Math.min(next.getTime(), Date.now());
    });
  };

  const unitLabel = displayUnitFor(selectedType, preferences.units);
  const validation = validateReadingInput(
    value,
    selectedType,
    preferences.units,
  );
  const showValueError = value.trim().length > 0 && !validation.ok;
  const rangeLine = formatUsualRange(selectedType, preferences.units, {
    isFasting,
    sex: preferences.referenceSex,
  });

  const toggleTag = (tag: ReadingTag) => {
    Haptics.selectionAsync();
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handlePickImage = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "Photo attachments require Expo Go. Run this app on your device to use this feature.",
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to attach images.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      Haptics.selectionAsync();
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "Camera requires Expo Go. Run this app on your device to use this feature.",
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow camera access to take photos.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      Haptics.selectionAsync();
    }
  };

  const handleSave = async () => {
    if (!validation.ok) return;

    setIsSaving(true);
    try {
      await addReading(selectedType, validation.canonicalValue, {
        notes: notes.trim() || undefined,
        isFasting,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        photoUri: photoUri || undefined,
        referenceSex: preferences.referenceSex,
        timestamp,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Failed to save reading. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ThemedText style={styles.label}>Reading Type</ThemedText>
      <View
        style={styles.typeGrid}
        accessibilityRole="radiogroup"
        accessibilityLabel="Reading type"
      >
        {READING_TYPES.map((type) => {
          const typeConfig = READING_CONFIG[type];
          const isSelected = selectedType === type;
          return (
            <Pressable
              key={type}
              onPress={() => setSelectedType(type)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={typeConfig.label}
              style={({ pressed }) => [
                styles.typeCard,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : theme.backgroundDefault,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather
                name={typeConfig.icon as any}
                size={24}
                color={isSelected ? "#FFFFFF" : colors.primary}
              />
              <ThemedText
                style={[
                  styles.typeLabel,
                  { color: isSelected ? "#FFFFFF" : theme.text },
                ]}
              >
                {typeConfig.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText style={styles.label}>Value</ThemedText>
      <View style={styles.valueContainer}>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          inputMode="decimal"
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Reading value"
          accessibilityHint="Number from your meter or lab report"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.valueInput,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: showValueError ? colors.error : "transparent",
            },
          ]}
        />
        <View
          style={[styles.unitBadge, { backgroundColor: colors.primary + "1A" }]}
        >
          <ThemedText style={[styles.unitText, { color: colors.primary }]}>
            {unitLabel}
          </ThemedText>
        </View>
      </View>

      {showValueError && !validation.ok ? (
        <ThemedText
          accessibilityLiveRegion="polite"
          style={[styles.errorText, { color: colors.error }]}
        >
          {validation.message}
        </ThemedText>
      ) : null}

      <View style={styles.rangeInfo}>
        <Feather name="info" size={14} color={theme.textSecondary} />
        <View style={styles.rangeCopy}>
          <ThemedText
            style={[styles.rangeText, { color: theme.textSecondary }]}
          >
            {rangeLine}
          </ThemedText>
          <ReferenceRangeNote />
        </View>
      </View>

      <ThemedText style={styles.label}>When</ThemedText>
      <ThemedText style={[styles.whenHint, { color: theme.textSecondary }]}>
        Log a past reading by changing the date or time. Future times are not
        saved.
      </ThemedText>
      <View style={styles.whenRow}>
        <DateTimeField
          mode="date"
          label="Date"
          value={new Date(timestamp)}
          maximumDate={new Date()}
          minimumDate={new Date(2000, 0, 1)}
          onChange={applyDate}
          accessibilityHint="Date the reading was taken"
        />
        <DateTimeField
          mode="time"
          label="Time"
          value={new Date(timestamp)}
          maximumDate={
            startOfLocalDay(timestamp).getTime() ===
            startOfLocalDay(Date.now()).getTime()
              ? new Date()
              : undefined
          }
          onChange={applyTime}
          accessibilityHint="Time the reading was taken"
        />
      </View>

      <View
        style={[
          styles.fastingRow,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        <View style={styles.fastingLabel}>
          <Feather name="clock" size={20} color={colors.primary} />
          <ThemedText style={styles.fastingText}>Fasting Reading</ThemedText>
        </View>
        <Switch
          value={isFasting}
          accessibilityLabel="Fasting reading"
          accessibilityHint="Uses the fasting reference range for glucose"
          onValueChange={(val) => {
            Haptics.selectionAsync();
            setIsFasting(val);
          }}
          trackColor={{ false: theme.border, true: colors.primary + "80" }}
          thumbColor={isFasting ? colors.primary : theme.backgroundSecondary}
        />
      </View>

      <ThemedText style={styles.label}>Tags (Optional)</ThemedText>
      <View style={styles.tagsGrid}>
        {READING_TAGS.filter((tag) => tag.id !== "fasting").map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <Pressable
              key={tag.id}
              onPress={() => toggleTag(tag.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={tag.label}
              style={({ pressed }) => [
                styles.tagChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : theme.backgroundDefault,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather
                name={tag.icon as any}
                size={14}
                color={isSelected ? "#FFFFFF" : colors.primary}
              />
              <ThemedText
                style={[
                  styles.tagText,
                  { color: isSelected ? "#FFFFFF" : theme.text },
                ]}
              >
                {tag.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText style={styles.label}>Photo Attachment (Optional)</ThemedText>
      {photoUri ? (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: photoUri }}
            style={styles.photoPreview}
            contentFit="cover"
          />
          <Pressable
            onPress={() => setPhotoUri(null)}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            accessibilityHint="Removes the picture attached to this reading"
            style={[styles.removePhotoBtn, { backgroundColor: colors.error }]}
          >
            <Feather name="x" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.photoButtons}>
          <Pressable
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel="Choose a photo from the library"
            accessibilityHint="Attaches a picture that stays on this device"
            style={({ pressed }) => [
              styles.photoBtn,
              {
                backgroundColor: theme.backgroundDefault,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="image" size={20} color={colors.primary} />
            <ThemedText style={[styles.photoBtnText, { color: theme.text }]}>
              Gallery
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={handleTakePhoto}
            accessibilityRole="button"
            accessibilityLabel="Take a photo"
            accessibilityHint="Uses the camera. The picture stays on this device"
            style={({ pressed }) => [
              styles.photoBtn,
              {
                backgroundColor: theme.backgroundDefault,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="camera" size={20} color={colors.primary} />
            <ThemedText style={[styles.photoBtnText, { color: theme.text }]}>
              Camera
            </ThemedText>
          </Pressable>
        </View>
      )}

      <ThemedText style={styles.label}>Notes (Optional)</ThemedText>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        accessibilityLabel="Notes"
        placeholder="Add any additional notes..."
        placeholderTextColor={theme.textSecondary}
        multiline
        numberOfLines={3}
        style={[
          styles.notesInput,
          {
            backgroundColor: theme.backgroundDefault,
            color: theme.text,
          },
        ]}
      />

      <View style={styles.buttonContainer}>
        <Button onPress={handleSave} disabled={isSaving || !validation.ok}>
          {isSaving ? "Saving..." : "Save Reading"}
        </Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  typeCard: {
    width: "48%",
    flexGrow: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  valueInput: {
    flex: 1,
    height: 64,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  unitBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  unitText: {
    fontSize: 16,
    fontWeight: "600",
  },
  rangeInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  rangeCopy: {
    flex: 1,
  },
  rangeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  fastingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  fastingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  fastingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  whenHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  whenRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
  },
  photoContainer: {
    marginBottom: Spacing.xl,
    position: "relative",
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  removePhotoBtn: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: MinTouchTarget,
    height: MinTouchTarget,
    borderRadius: MinTouchTarget / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  photoButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    minHeight: MinTouchTarget,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  photoBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notesInput: {
    minHeight: 80,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    marginTop: "auto",
  },
});
