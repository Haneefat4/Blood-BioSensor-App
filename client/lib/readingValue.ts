import type { ReadingType } from "@/types";
import { READING_CONFIG } from "@/types";
import { REFERENCE_RANGES } from "@/lib/referenceRanges";
import {
  displayUnitFor,
  formatMeasurement,
  toCanonicalValue,
  type UnitSystem,
} from "@/lib/units";

export type ReadingValueCheck =
  | { ok: true; displayValue: number; canonicalValue: number }
  | { ok: false; message: string };

/**
 * Parse a typed reading.
 *
 * One decimal separator is allowed, and it may be either "." or ",".
 * "5,5" and "5.5" are both 5.5. Thousands separators are not accepted:
 * a comma is always the decimal mark, so "1,000" is 1.
 * "12abc", signs, exponents, and a trailing separator ("5,") are rejected.
 * parseFloat would have turned "12abc" into 12 and stopped at the comma
 * in "5,5", which is why this is stricter than Number or parseFloat.
 */
export function parseReadingValue(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d*)([.,])?(\d*)$/);
  if (!match) return null;

  const whole = match[1] ?? "";
  const separator = match[2];
  const fraction = match[3] ?? "";
  if (separator && fraction.length === 0) return null;
  if (!separator && whole.length === 0) return null;

  const normalized = separator
    ? `${whole.length > 0 ? whole : "0"}.${fraction}`
    : whole;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return value;
}

function inputLimits(type: ReadingType): { min: number; max: number } {
  switch (type) {
    case "glucose":
      return REFERENCE_RANGES.glucose.input;
    case "hemoglobin":
      return REFERENCE_RANGES.hemoglobin.input;
    case "cholesterol":
      return REFERENCE_RANGES.cholesterol.input;
    case "platelets":
      return REFERENCE_RANGES.platelets.input;
  }
}

/**
 * Check a value typed in the unit the user currently has selected.
 * Limits are the canonical min/max in REFERENCE_RANGES, converted for
 * the message. Glucose and cholesterol limits follow mg/dL or mmol/L.
 * Hemoglobin and platelets stay in g/dL and K/uL.
 */
export function validateReadingInput(
  raw: string,
  type: ReadingType,
  system: UnitSystem,
): ReadingValueCheck {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: "Enter a number." };
  }

  const displayValue = parseReadingValue(trimmed);
  if (displayValue === null) {
    return {
      ok: false,
      message: "Enter a number. Use a comma or a period for the decimal.",
    };
  }

  const canonicalValue = toCanonicalValue(type, displayValue, system);
  const limits = inputLimits(type);
  const unit = displayUnitFor(type, system);
  // Compare in the unit the person typed. The message uses the same rounded
  // bounds, so a value the message lists as the maximum is accepted.
  const minText = formatMeasurement(type, limits.min, system, {
    keepDecimals: true,
  });
  const maxText = formatMeasurement(type, limits.max, system, {
    keepDecimals: true,
  });
  if (displayValue < Number(minText) || displayValue > Number(maxText)) {
    const label = READING_CONFIG[type].label.toLowerCase();
    return {
      ok: false,
      message: `Enter a ${label} value from ${minText} to ${maxText} ${unit}.`,
    };
  }

  return { ok: true, displayValue, canonicalValue };
}
