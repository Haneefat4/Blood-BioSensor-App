import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import HomeScreen from "@/screens/HomeScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { useReadingsContext } from "@/context/ReadingsContext";
import { MinTouchTarget } from "@/constants/theme";

export type HomeStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

function RefreshReadingsButton() {
  const { theme } = useTheme();
  const { refresh } = useReadingsContext();
  const [refreshing, setRefreshing] = useState(false);

  const onPress = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={refreshing}
      accessibilityRole="button"
      accessibilityLabel="Refresh readings"
      accessibilityHint="Reloads readings saved on this device"
      style={({ pressed }) => [
        styles.refreshButton,
        { opacity: pressed || refreshing ? 0.7 : 1 },
      ]}
    >
      {refreshing ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : (
        <Feather name="refresh-cw" size={20} color={theme.text} />
      )}
    </Pressable>
  );
}

export default function HomeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Blood Biosensor" />,
          headerRight: () => <RefreshReadingsButton />,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  refreshButton: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
