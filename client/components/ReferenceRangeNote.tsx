import React from "react";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { REFERENCE_RANGE_NOTE } from "@/lib/referenceRanges";

export function ReferenceRangeNote() {
  const { theme } = useTheme();

  return (
    <ThemedText style={[styles.note, { color: theme.textSecondary }]}>
      {REFERENCE_RANGE_NOTE}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
