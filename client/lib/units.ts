import type { ReadingType } from "@/types";
import { READING_CONFIG } from "@/types";

export type UnitSystem = "mg/dL" | "mmol/L";

/**
 * mg/dL per 1 mmol/L. Glucose and total cholesterol are the only reading
 * types this preference converts. Hemoglobin (g/dL) and platelets (K/uL)
 * are stored and shown unchanged.
 *
 * Status ranges stay in the canonical unit in client/lib/referenceRanges.ts
 * and are not rewritten here. Convert before scoring a reading.
 */
const MGDL_PER_MMOL: Partial<Record<ReadingType, number>> = {
  glucose: 18.016,
  cholesterol: 38.67,
};

export function isUnitConvertible(type: ReadingType): boolean {
  return type === "glucose" || type === "cholesterol";
}

export function canonicalUnit(type: ReadingType): string {
  return READING_CONFIG[type].defaultUnit;
}

export function displayUnitFor(type: ReadingType, system: UnitSystem): string {
  if (system === "mmol/L" && isUnitConvertible(type)) {
    return "mmol/L";
  }
  return canonicalUnit(type);
}

/** Convert a value the user entered in `system` into the stored unit. */
export function toCanonicalValue(
  type: ReadingType,
  value: number,
  system: UnitSystem,
): number {
  const factor = MGDL_PER_MMOL[type];
  if (system === "mmol/L" && factor) {
    return value * factor;
  }
  return value;
}

/** Convert a stored value into the unit currently selected in preferences. */
export function toDisplayValue(
  type: ReadingType,
  canonicalValue: number,
  system: UnitSystem,
): number {
  const factor = MGDL_PER_MMOL[type];
  if (system === "mmol/L" && factor) {
    return canonicalValue / factor;
  }
  return canonicalValue;
}

function decimalsFor(type: ReadingType, system: UnitSystem): number {
  if (system === "mmol/L" && type === "cholesterol") return 2;
  if (system === "mmol/L" && type === "glucose") return 1;
  if (type === "hemoglobin") return 1;
  return 0;
}

export function formatMeasurement(
  type: ReadingType,
  canonicalValue: number,
  system: UnitSystem,
  options?: { keepDecimals?: boolean },
): string {
  const display = toDisplayValue(type, canonicalValue, system);
  const fixed = display.toFixed(decimalsFor(type, system));
  if (options?.keepDecimals) return fixed;
  return Number(fixed).toString();
}
