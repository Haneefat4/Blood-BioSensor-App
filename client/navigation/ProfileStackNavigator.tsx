import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import MedicationsScreen from "@/screens/MedicationsScreen";
import RemindersScreen from "@/screens/RemindersScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Medications: undefined;
  Reminders: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="Medications"
        component={MedicationsScreen}
        options={{
          title: "Medications",
        }}
      />
      <Stack.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          title: "Reminders",
        }}
      />
    </Stack.Navigator>
  );
}
