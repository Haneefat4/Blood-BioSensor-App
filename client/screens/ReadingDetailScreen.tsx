import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { useTheme } from "@/hooks/useTheme";
import { useReadingDisplay } from "@/hooks/useReadingDisplay";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { ReferenceRangeNote } from "@/components/ReferenceRangeNote";
import { useReadingsContext } from "@/context/ReadingsContext";
import type { HistoryStackParamList } from "@/navigation/HistoryStackNavigator";
import { READING_CONFIG, READING_TAGS } from "@/types";

type Props = NativeStackScreenProps<HistoryStackParamList, "ReadingDetail">;

export default function ReadingDetailScreen({ route, navigation }: Props) {
  const { readingId } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { valueText, unitText, assess, rangeText } = useReadingDisplay();
  const colors = isDark ? Colors.dark : Colors.light;
  const { readings } = useReadingsContext();
  const reading = readings.find((item) => item.id === readingId);
  const [photoOpen, setPhotoOpen] = useState(false);

  useEffect(() => {
    if (!reading) {
      navigation.goBack();
    }
  }, [reading, navigation]);

  if (!reading) return null;

  const config = READING_CONFIG[reading.type];
  const assessment = assess(reading);
  const timestamp = new Date(reading.timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const tagLabels =
    reading.tags?.map(
      (tagId) => READING_TAGS.find((tag) => tag.id === tagId)?.label || tagId,
    ) ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View
              style={[styles.icon, { backgroundColor: colors.primary + "1A" }]}
            >
              <Feather
                name={config.icon as keyof typeof Feather.glyphMap}
                size={20}
                color={colors.primary}
              />
            </View>
            <ThemedText style={styles.title}>{config.label}</ThemedText>
          </View>
          <StatusBadge status={assessment.severity} label={assessment.label} />
        </View>
        <View style={styles.valueRow}>
          <ThemedText style={styles.value}>{valueText(reading)}</ThemedText>
          <ThemedText style={[styles.unit, { color: theme.textSecondary }]}>
            {unitText(reading.type)}
          </ThemedText>
        </View>
        <ThemedText style={[styles.meta, { color: theme.textSecondary }]}>
          {timestamp}
        </ThemedText>
        {reading.isFasting ? (
          <View
            style={[styles.fasting, { backgroundColor: colors.warning + "20" }]}
          >
            <Feather name="clock" size={14} color={colors.warning} />
            <ThemedText style={{ color: colors.warning, fontWeight: "600" }}>
              Fasting
            </ThemedText>
          </View>
        ) : null}
        {tagLabels.length > 0 ? (
          <View style={styles.tags}>
            {tagLabels.map((label) => (
              <View
                key={label}
                style={[styles.tag, { backgroundColor: colors.primary + "15" }]}
              >
                <ThemedText style={[styles.tagText, { color: colors.primary }]}>
                  {label}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}
        {reading.notes ? (
          <ThemedText style={styles.notes}>{reading.notes}</ThemedText>
        ) : null}
        <View style={styles.rangeBlock}>
          <ThemedText
            style={[styles.rangeText, { color: theme.textSecondary }]}
          >
            {rangeText(reading.type, { isFasting: reading.isFasting })}
          </ThemedText>
          <ReferenceRangeNote />
        </View>
      </View>

      {reading.photoUri ? (
        <Pressable
          onPress={() => setPhotoOpen(true)}
          accessibilityRole="imagebutton"
          accessibilityLabel="View attached photo"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Image
            source={{ uri: reading.photoUri }}
            style={styles.photo}
            contentFit="cover"
          />
          <ThemedText
            style={[styles.photoHint, { color: theme.textSecondary }]}
          >
            Tap the photo to view it larger
          </ThemedText>
        </Pressable>
      ) : null}

      <Modal
        visible={photoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoOpen(false)}
      >
        <View style={styles.viewer}>
          <Pressable
            onPress={() => setPhotoOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close photo"
            hitSlop={12}
            style={styles.closeButton}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
          {reading.photoUri ? (
            <Image
              source={{ uri: reading.photoUri }}
              style={styles.viewerImage}
              contentFit="contain"
            />
          ) : null}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
  },
  value: {
    fontSize: 40,
    fontWeight: "700",
  },
  unit: {
    fontSize: 16,
    fontWeight: "500",
  },
  meta: {
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  fasting: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  notes: {
    marginTop: Spacing.md,
    fontSize: 16,
    lineHeight: 22,
  },
  rangeBlock: {
    marginTop: Spacing.lg,
  },
  rangeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  photo: {
    width: "100%",
    height: 240,
    borderRadius: BorderRadius.lg,
  },
  photoHint: {
    fontSize: 13,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  viewer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
  },
  viewerImage: {
    width: "100%",
    height: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 56,
    right: Spacing.lg,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
