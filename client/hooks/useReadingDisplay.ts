import { usePreferencesContext } from "@/context/PreferencesContext";
import {
  displayUnitFor,
  formatMeasurement,
  formatNormalRange,
} from "@/lib/units";
import type { Reading, ReadingType } from "@/types";

export function useReadingDisplay() {
  const { preferences } = usePreferencesContext();
  const units = preferences.units;

  return {
    units,
    valueText: (reading: Reading) =>
      formatMeasurement(reading.type, reading.value, units),
    unitText: (type: ReadingType) => displayUnitFor(type, units),
    rangeText: (type: ReadingType) => formatNormalRange(type, units),
  };
}
