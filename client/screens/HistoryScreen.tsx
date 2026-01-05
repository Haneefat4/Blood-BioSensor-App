import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ReadingListItem } from "@/components/ReadingListItem";
import { EmptyState } from "@/components/EmptyState";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { ComparisonChart } from "@/components/ComparisonChart";
import { useReadingsContext } from "@/context/ReadingsContext";
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

const VIEW_MODES: { value: ViewMode; icon: keyof typeof Feather.glyphMap; label: string }[] = [
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
  const { readings, removeReading } = useReadingsContext();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDayReadings, setSelectedDayReadings] = useState<Reading[] | null>(null);

  const filteredReadings = useMemo(() => {
    if (selectedFilter === "all") return readings;
    return readings.filter((r) => r.type === selectedFilter);
  }, [readings, selectedFilter]);

  const handleDelete = (reading: Reading) => {
    Alert.alert(
      "Delete Reading",
      `Are you sure you want to delete this ${READING_CONFIG[reading.type].label} reading?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeReading(reading.id),
        },
      ]
    );
  };

  const handleDayPress = (date: Date, dayReadings: Reading[]) => {
    setSelectedDayReadings(dayReadings);
  };

  const clearSelectedDay = () => {
    setSelectedDayReadings(null);
  };

  const renderItem = ({ item }: { item: Reading }) => (
    <ReadingListItem reading={item} onDelete={() => handleDelete(item)} />
  );

  const ViewModeSelector = () => (
    <View style={[styles.viewModeWrapper, { backgroundColor: theme.backgroundDefault }]}>
      {VIEW_MODES.map((mode) => {
        const isActive = viewMode === mode.value;
        return (
          <Pressable
            key={mode.value}
            onPress={() => {
              Haptics.selectionAsync();
              setViewMode(mode.value);
              setSelectedDayReadings(null);
            }}
            style={[
              styles.viewModeBtn,
              { backgroundColor: isActive ? colors.primary : "transparent" },
            ]}
          >
            <Feather
              name={mode.icon}
              size={14}
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
  );

  const FilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScrollContainer}
      contentContainerStyle={styles.filterScrollContent}
    >
      {FILTERS.map((item) => (
        <Pressable
          key={item.value}
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedFilter(item.value);
          }}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                selectedFilter === item.value ? colors.primary : theme.backgroundDefault,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.filterText,
              { color: selectedFilter === item.value ? "#FFFFFF" : theme.text },
            ]}
          >
            {item.label}
          </ThemedText>
        </Pressable>
      ))}
    </ScrollView>
  );

  const SelectedDayPanel = () => {
    if (!selectedDayReadings) return null;
    return (
      <View style={[styles.selectedDayPanel, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.selectedDayHeader}>
          <ThemedText style={styles.selectedDayTitle}>
            {selectedDayReadings.length} reading{selectedDayReadings.length !== 1 ? "s" : ""}
          </ThemedText>
          <Pressable onPress={clearSelectedDay} hitSlop={12}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
        {selectedDayReadings.map((reading) => (
          <ReadingListItem
            key={reading.id}
            reading={reading}
            onDelete={() => handleDelete(reading)}
          />
        ))}
      </View>
    );
  };

  if (viewMode === "calendar") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
        >
          <ViewModeSelector />
          <View style={styles.sectionGap} />
          <CalendarHeatmap readings={readings} onDayPress={handleDayPress} />
          <SelectedDayPanel />
        </ScrollView>
      </View>
    );
  }

  if (viewMode === "chart") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
        >
          <ViewModeSelector />
          <View style={styles.sectionGap} />
          <ComparisonChart readings={readings} />
          <View style={styles.sectionGap} />
          <CalendarHeatmap readings={readings} onDayPress={handleDayPress} />
          <SelectedDayPanel />
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
        data={filteredReadings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ViewModeSelector />
            <View style={styles.sectionGap} />
            <FilterChips />
            <View style={styles.sectionGap} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard"
            title="No readings yet"
            subtitle="Start tracking your health by adding your first reading"
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
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  viewModeLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterScrollContainer: {
    marginHorizontal: -Spacing.lg,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
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
  },
});
