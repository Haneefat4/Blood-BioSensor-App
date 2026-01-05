import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ReadingListItem } from "@/components/ReadingListItem";
import { EmptyState } from "@/components/EmptyState";
import { useReadingsContext } from "@/context/ReadingsContext";
import type { ReadingType, Reading } from "@/types";
import { READING_CONFIG } from "@/types";

type FilterType = "all" | ReadingType;

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "glucose", label: "Glucose" },
  { value: "hemoglobin", label: "Hemoglobin" },
  { value: "cholesterol", label: "Cholesterol" },
  { value: "platelets", label: "Platelets" },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { readings, removeReading } = useReadingsContext();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

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

  const renderItem = ({ item }: { item: Reading }) => (
    <ReadingListItem
      reading={item}
      onDelete={() => handleDelete(item)}
    />
  );

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
          <View style={styles.filterContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={FILTERS}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.filterScroll}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedFilter(item.value)}
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
              )}
            />
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
});
