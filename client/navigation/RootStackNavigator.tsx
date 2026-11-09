import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AddReadingScreen from "@/screens/AddReadingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { MinTouchTarget } from "@/constants/theme";

import type { ReadingType } from "@/types";

export type RootStackParamList = {
  Main: undefined;
  AddReading: { readingId?: string; initialType?: ReadingType } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddReading"
        component={AddReadingScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "Add Reading",
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Close add reading"
              accessibilityHint="Discards this entry"
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
