import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HistoryScreen from "@/screens/HistoryScreen";
import ReadingDetailScreen from "@/screens/ReadingDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type HistoryStackParamList = {
  History: undefined;
  ReadingDetail: { readingId: string };
};

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerTitle: "History",
        }}
      />
      <Stack.Screen
        name="ReadingDetail"
        component={ReadingDetailScreen}
        options={{
          headerTitle: "Reading",
        }}
      />
    </Stack.Navigator>
  );
}
