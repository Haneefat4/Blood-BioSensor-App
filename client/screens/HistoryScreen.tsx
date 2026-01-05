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
  { value: "chart", icon: "bar-chart-2", label: "Compare" },
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

  const renderItem = ({ item }: { item: Reading }) => (
    <ReadingListItem
      reading={item}
      onDelete={() => handleDelete(item)}
    />
  );

  const renderViewModeSelector = () => (
    <View style={[styles.viewModeContainer, { backgroundColor: theme.backgroundDefault }]}>
      {VIEW_MODES.map((mode) => (
        <Pressable
          key={mode.value}
          onPress={() => {
            Haptics.selectionAsync();
            setViewMode(mode.value);
            setSelectedDayReadings(null);
          }}
          style={[
            styles.viewModeBtn,
            {
              backgroundColor: viewMode === mode.value ? colors.primary : "transparent",
            },
          ]}
        >
          <Feather
            name={mode.icon}
            size={16}
            color={viewMode === mode.value ? "#FFFFFF" : theme.textSecondary}
          />
        </Pressable>
      ))}
    </View>
  );

  const renderCalendarView = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      {renderViewModeSelector()}
      <CalendarHeatmap
        readings={readings}
        onDayPress={handleDayPress}
      />
      {selectedDayReadings ? (
        <View style={styles.dayReadingsContainer}>
          <View style={styles.dayReadingsHeader}>
            <ThemedText style={styles.dayReadingsTitle}>
              {selectedDayReadings.length} reading{selectedDayReadings.length !== 1 ? "s" : ""} on this day
            </ThemedText>
            <Pressable onPress={() => setSelectedDayReadings(null)}>
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
      ) : null}
    </ScrollView>
  );

  const renderChartView = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      {renderViewModeSelector()}
      <ComparisonChart readings={readings} />
      <View style={{ height: Spacing.lg }} />
      <CalendarHeatmap readings={readings} onDayPress={handleDayPress} />
    </ScrollView>
  );

  if (viewMode === "calendar") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        {renderCalendarView()}
      </View>
    );
  }

  if (viewMode === "chart") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        {renderChartView()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredReadings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View>
            {renderViewModeSelector()}
            <View style={styles.filterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {FILTERS.map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedFilter(item.value);
                    }}
                    style={({ pressed }) => [
                      styles.filterChip,
                      {
                        backgroundColor:
                          selectedFilter === item.value
                            ? colors.primary
                            : theme.backgroundDefault,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.filterText,
                        {
                          color:
                            selectedFilter === item.value
                              ? "#FFFFFF"
                              : theme.text,
                        },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
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
  viewModeContainer: {
    flexDirection: "row",
    alignSelf: "center",
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  viewModeBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  filterContainer: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dayReadingsContainer: {
    marginTop: Spacing.lg,
  },
  dayReadingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  dayReadingsTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
