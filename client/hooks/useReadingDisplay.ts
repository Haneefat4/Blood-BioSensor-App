import { usePreferencesContext } from "@/context/PreferencesContext";
import { displayUnitFor, formatMeasurement } from "@/lib/units";
import { assessReading, formatUsualRange } from "@/lib/referenceRanges";
import type { Reading, ReadingType } from "@/types";

export function useReadingDisplay() {
  const { preferences } = usePreferencesContext();
  const units = preferences.units;
  const sex = preferences.referenceSex;

  return {
    units,
    sex,
    valueText: (reading: Reading) =>
      formatMeasurement(reading.type, reading.value, units),
    unitText: (type: ReadingType) => displayUnitFor(type, units),
    rangeText: (type: ReadingType, options?: { isFasting?: boolean }) =>
      formatUsualRange(type, units, {
        isFasting: options?.isFasting,
        sex,
      }),
    assess: (reading: Reading) =>
      assessReading({
        type: reading.type,
        canonicalValue: reading.value,
        isFasting: reading.isFasting,
        sex,
      }),
  };
}
