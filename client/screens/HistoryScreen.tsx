import React, { useMemo, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useFeedback } from "@/components/FeedbackProvider";
import { useTheme } from "@/hooks/useTheme";
import {
  BorderRadius,
  MinTouchTarget,
  Spacing,
  Colors,
} from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ReadingListItem } from "@/components/ReadingListItem";
import { EmptyState } from "@/components/EmptyState";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { ComparisonChart } from "@/components/ComparisonChart";
import { DateTimeField } from "@/components/DateTimeField";
import { useReadingsContext } from "@/context/ReadingsContext";
import { usePreferencesContext } from "@/context/PreferencesContext";
import { buildReadingsCsv } from "@/lib/exportFormat";
import {
  filterReadings,
  localDateKey,
  startOfLocalDay,
  type HistoryRange,
} from "@/lib/readingOrder";
import { isShareCancelled, shareTextFile } from "@/lib/shareFile";
import type { HistoryStackParamList } from "@/navigation/HistoryStackNavigator";
import type { ReadingType, Reading } from "@/types";
import { READING_CONFIG } from "@/types";

type FilterType = "all" | ReadingType;
type ViewMode = "list" | "calendar" | "chart";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "glucose", label: "Glucose" },
  { value: "hemoglobin", label: "Hemoglobin" },
  { value: "cholesterol", label: "Cholesterol" },
  { value: "platelets", label: "Platelets" },
];

const RANGES: { value: HistoryRange; label: string }[] = [
  { value: "all", label: "Any date" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "custom", label: "Custom" },
];

const VIEW_MODES: {
  value: ViewMode;
  icon: keyof typeof Feather.glyphMap;
  label: string;
}[] = [
  { value: "list", icon: "list", label: "List" },
  { value: "calendar", icon: "calendar", label: "Calendar" },
  { value: "chart", icon: "bar-chart-2", label: "Charts" },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const navigation =
    useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
  const { readings, removeReading } = useReadingsContext();
  const { preferences } = usePreferencesContext();
  const { confirm, notify } = useFeedback();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<HistoryRange>("all");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<{
    key: string;
    label: string;
  } | null>(null);

  const filteredReadings = useMemo(
    () =>
      filterReadings(readings, {
        type: selectedFilter,
        query,
        range,
        customStart: customStart ? customStart.getTime() : null,
        customEnd: customEnd ? customEnd.getTime() : null,
        now: Date.now(),
      }),
    [readings, selectedFilter, query, range, customStart, customEnd],
  );

  const selectedDayReadings = useMemo(() => {
    if (!selectedDay) return [];
    return filteredReadings.filter(
      (reading) => localDateKey(reading.timestamp) === selectedDay.key,
    );
  }, [filteredReadings, selectedDay]);

  const handleDelete = async (reading: Reading) => {
    const confirmed = await confirm({
      title: "Delete Reading",
      message: `Delete this ${READING_CONFIG[reading.type].label} reading from your log?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await removeReading(reading.id);
      notify({ tone: "success", message: "Reading deleted." });
    } catch {
      notify({
        tone: "error",
        message: "Could not delete that reading. Please try again.",
      });
    }
  };

  const handleExport = async (reading: Reading) => {
    try {
      const csv = buildReadingsCsv([reading], {
        units: preferences.units,
        sex: preferences.referenceSex,
      });
      const day = new Date(reading.timestamp).toISOString().slice(0, 10);
      await shareTextFile(
        `blood-biosensor-${reading.type}-${day}.csv`,
        csv,
        "text/csv",
      );
      if (Platform.OS === "web") {
        notify({ tone: "success", message: "CSV downloaded." });
      }
    } catch (error) {
      if (isShareCancelled(error)) return;
      notify({
        tone: "error",
        message: "This reading could not be exported. Please try again.",
      });
    }
  };

  const handleDayPress = (date: Date) => {
    setSelectedDay({
      key: localDateKey(date),
      label: date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    });
  };

  const openReading = (reading: Reading) => {
    navigation.navigate("ReadingDetail", { readingId: reading.id });
  };

  const today = startOfLocalDay(Date.now());

  const controls = (
    <View>
      <View
        accessibilityRole="tablist"
        style={[
          styles.viewModeWrapper,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        {VIEW_MODES.map((mode) => {
          const isActive = viewMode === mode.value;
          return (
            <Pressable
              key={mode.value}
              onPress={() => {
                Haptics.selectionAsync();
                setViewMode(mode.value);
                setSelectedDay(null);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${mode.label} view`}
              style={[
                styles.viewModeBtn,
                { backgroundColor: isActive ? colors.primary : "transparent" },
              ]}
            >
              <Feather
                name={mode.icon}
                size={16}
                color={isActive ? "#FFFFFF" : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.viewModeLabel,
                  { color: isActive ? "#FFFFFF" : theme.textSecondary },
                ]}
              >
                {mode.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search notes or type"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Search readings"
        accessibilityHint="Filters the list by reading type, notes, or value"
        autoCorrect={false}
        style={[
          styles.search,
          { backgroundColor: theme.backgroundDefault, color: theme.text },
        ]}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollContainer}
        contentContainerStyle={styles.filterScrollContent}
      >
        {FILTERS.map((item) => {
          const selected = selectedFilter === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedFilter(item.value);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Show ${item.label} readings`}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected
                    ? colors.primary
                    : theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  { color: selected ? "#FFFFFF" : theme.text },
                ]}
              >
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollContainer}
        contentContainerStyle={styles.filterScrollContent}
      >
        {RANGES.map((item) => {
          const selected = range === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => {
                Haptics.selectionAsync();
                if (item.value === "custom") {
                  setCustomStart(
                    (current) => current ?? startOfLocalDay(Date.now()),
                  );
                  setCustomEnd((current) => current ?? new Date());
                }
                setRange(item.value);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Date range ${item.label}`}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected
                    ? colors.primary
                    : theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  { color: selected ? "#FFFFFF" : theme.text },
                ]}
              >
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {range === "custom" ? (
        <View style={styles.customDates}>
          <DateTimeField
            mode="date"
            label="From"
            value={customStart ?? today}
            maximumDate={customEnd ?? new Date()}
            onChange={setCustomStart}
            accessibilityHint="Start of the date range"
          />
          <DateTimeField
            mode="date"
            label="To"
            value={customEnd ?? new Date()}
            minimumDate={customStart ?? undefined}
            maximumDate={new Date()}
            onChange={setCustomEnd}
            accessibilityHint="End of the date range"
          />
        </View>
      ) : null}

      <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
        Each row has Export and Delete. On a phone you can also swipe the row
        left.
      </ThemedText>
    </View>
  );

  const selectedDayPanel =
    selectedDay == null ? null : (
      <View
        style={[
          styles.selectedDayPanel,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        <View style={styles.selectedDayHeader}>
          <ThemedText style={styles.selectedDayTitle}>
            {selectedDay.label} ·{" "}
            {selectedDayReadings.length === 0
              ? "No readings"
              : `${selectedDayReadings.length} reading${selectedDayReadings.length === 1 ? "" : "s"}`}
          </ThemedText>
          <Pressable
            onPress={() => setSelectedDay(null)}
            accessibilityRole="button"
            accessibilityLabel="Clear selected day"
            style={styles.iconButton}
          >
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
        {selectedDayReadings.map((reading) => (
          <View key={reading.id} style={styles.dayItem}>
            <ReadingListItem
              reading={reading}
              onPress={() => openReading(reading)}
              onDelete={() => handleDelete(reading)}
              onExport={() => handleExport(reading)}
            />
          </View>
        ))}
      </View>
    );

  if (viewMode !== "list") {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          {controls}
          <View style={styles.sectionGap} />
          {viewMode === "chart" ? (
            <>
              <ComparisonChart readings={filteredReadings} />
              <View style={styles.sectionGap} />
            </>
          ) : null}
          <CalendarHeatmap
            readings={filteredReadings}
            onDayPress={handleDayPress}
          />
          {selectedDayPanel}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
        data={filteredReadings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReadingListItem
            reading={item}
            onPress={() => openReading(item)}
            onDelete={() => handleDelete(item)}
            onExport={() => handleExport(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {controls}
            <View style={styles.sectionGap} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard"
            title={
              readings.length === 0 ? "No readings yet" : "No matching readings"
            }
            subtitle={
              readings.length === 0
                ? "Add a reading you already have to start your log."
                : "Try a different search or date range."
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  listHeader: {
    marginBottom: Spacing.sm,
  },
  listSeparator: {
    height: Spacing.sm,
  },
  sectionGap: {
    height: Spacing.md,
  },
  viewModeWrapper: {
    flexDirection: "row",
    alignSelf: "center",
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  viewModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  viewModeLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  search: {
    minHeight: MinTouchTarget,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    fontSize: 16,
  },
  filterScrollContainer: {
    marginHorizontal: -Spacing.lg,
    marginTop: Spacing.md,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  customDates: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.md,
  },
  selectedDayPanel: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  selectedDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  dayItem: {
    marginBottom: Spacing.sm,
  },
  iconButton: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
