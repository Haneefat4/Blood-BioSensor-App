import React, { useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { HeroCard } from "@/components/HeroCard";
import { QuickStatCard } from "@/components/QuickStatCard";
import { TrendChart } from "@/components/TrendChart";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { ReferenceRangeNote } from "@/components/ReferenceRangeNote";
import { useReadingsContext } from "@/context/ReadingsContext";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { ReadingType } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const READING_TYPES: ReadingType[] = [
  "glucose",
  "hemoglobin",
  "cholesterol",
  "platelets",
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { readings, getLatestByType, getLatestReading, refresh } =
    useReadingsContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const latestReading = getLatestReading();
  const primaryType = latestReading?.type || "glucose";

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <HeroCard reading={latestReading} />

        <ThemedText style={styles.sectionTitle}>Quick Stats</ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            {READING_TYPES.slice(0, 2).map((type) => (
              <QuickStatCard
                key={type}
                type={type}
                reading={getLatestByType(type)}
              />
            ))}
          </View>
          <View style={styles.statsRow}>
            {READING_TYPES.slice(2, 4).map((type) => (
              <QuickStatCard
                key={type}
                type={type}
                reading={getLatestByType(type)}
              />
            ))}
          </View>
        </View>

        <TrendChart readings={readings} type={primaryType} />
        <ReferenceRangeNote />
      </ScrollView>

      <FloatingActionButton
        onPress={() => navigation.navigate("AddReading")}
        bottomOffset={tabBarHeight + Spacing.xl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    gap: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
});
