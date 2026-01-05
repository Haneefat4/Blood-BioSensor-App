import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AddReadingScreen from "@/screens/AddReadingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

export type RootStackParamList = {
  Main: undefined;
  AddReading: undefined;
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
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
