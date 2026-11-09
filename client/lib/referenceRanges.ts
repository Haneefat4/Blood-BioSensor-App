import type { ReadingStatus, ReadingType, ReferenceSex } from "@/types";
import { normalizeReferenceSex } from "@/types";
import {
  displayUnitFor,
  formatMeasurement,
  type UnitSystem,
} from "@/lib/units";

/**
 * Reference ranges, status bands, and add-reading limits.
 *
 * This is the only file a clinician needs to review for cut points.
 * Every number below is in the canonical storage unit:
 *   glucose and total cholesterol: mg/dL
 *   hemoglobin: g/dL
 *   platelets: K/uL (× 10³/µL)
 *
 * mmol/L is display-only. Convert with client/lib/units.ts before calling
 * assessReading. Screens recompute status from these cuts, so editing a
 * number here updates Home, History, charts, and exports for old readings.
 *
 * These are general published ranges, not personal targets and not medical
 * advice. A clinician should sign off before they are treated as guidance.
 */

export interface ReadingAssessment {
  /** Drives color and icon shape: normal, warning, or critical. */
  severity: ReadingStatus;
  /** Plain label shown next to the icon. Not the word "Critical". */
  label: string;
}

export const REFERENCE_RANGE_NOTE =
  "These are general reference ranges, not medical advice. Check results with a clinician.";

export const REFERENCE_RANGES = {
  /**
   * Glucose, mg/dL.
   *
   * American Diabetes Association, Standards of Care in Diabetes
   * (classification and glycemic-goals chapters; these cuts have been
   * stable across recent editions):
   *   Fasting plasma glucose: under 100 mg/dL (5.6 mmol/L) usual,
   *     100–125 mg/dL (5.6–6.9) impaired fasting glucose,
   *     126 mg/dL (7.0) and above in the diabetes range.
   *   2-hour plasma glucose on a 75 g OGTT, used here for non-fasting
   *     and after-meal readings: under 140 mg/dL (7.8 mmol/L) usual,
   *     140–199 mg/dL (7.8–11.0) elevated,
   *     200 mg/dL (11.1) and above high. A random glucose of 200 mg/dL
   *     or more with symptoms is the ADA diabetes threshold.
   *   Hypoglycemia: Level 1 is under 70 mg/dL (3.9 mmol/L) and at least
   *     54 mg/dL (3.0). Level 2 is under 54 mg/dL.
   *
   * The fasting switch on a reading selects the fasting column. Anything
   * else, including a missing flag on an older reading, uses non-fasting.
   *
   * ADA does not define one home-meter "critical high." Sick-day guidance
   * often says to call a clinician for readings that stay above 250 mg/dL,
   * and many education sheets treat about 300 mg/dL as urgently high.
   * This app keeps 250–299 mg/dL as High (warning) and uses 300 mg/dL as
   * the Very high (critical) cut so one moderately high reading is not
   * given the strongest label.
   *
   * input is the add-form sanity window, wider than the clinical bands,
   * about the span of a typical home meter (LO near 20 through HI near 600).
   */
  glucose: {
    veryLowBelowMgDl: 54,
    normalAtOrAboveMgDl: 70,
    veryHighAtOrAboveMgDl: 300,
    fasting: {
      elevatedAtOrAboveMgDl: 100,
      highAtOrAboveMgDl: 126,
    },
    nonFasting: {
      elevatedAtOrAboveMgDl: 140,
      highAtOrAboveMgDl: 200,
    },
    input: { min: 10, max: 600 },
  },
  /**
   * Hemoglobin, g/dL.
   *
   * Usual adult intervals published by many clinical laboratories:
   *   female 12.0–15.5 g/dL, male 13.5–17.5 g/dL.
   *   Not specified keeps a combined adult interval of 12.0–17.0 g/dL
   *   so a value is not marked out of range unless it sits outside that
   *   shared span. Profile stores the choice and it is applied when the
   *   reading is shown, including readings saved earlier.
   *
   * WHO haemoglobin cut points for anaemia are under 12.0 g/dL for
   * non-pregnant women and under 13.0 g/dL for men (WHO, 2011). Values
   * below the sex-specific usual range and down to 7.0 g/dL are labeled
   * Low (warning). Under 7.0 g/dL is Very low (critical), in line with
   * the common restrictive transfusion threshold of 7 g/dL for stable
   * adults (AABB). WHO's severe-anaemia group is nearer 8 g/dL; move
   * veryLowBelowGDl if that cut is preferred.
   *
   * Above the usual top, through 20.0 g/dL, is High (warning). Above
   * 20.0 g/dL is Very high (critical): well above usual adult intervals.
   *
   * input accepts severe lows and highs so they can be logged.
   */
  hemoglobin: {
    veryLowBelowGDl: 7,
    veryHighAboveGDl: 20,
    normal: {
      female: { min: 12.0, max: 15.5 },
      male: { min: 13.5, max: 17.5 },
      unspecified: { min: 12.0, max: 17.0 },
    },
    input: { min: 1, max: 25 },
  },
  /**
   * Total cholesterol, mg/dL.
   *
   * National Heart, Lung, and Blood Institute patient guidance, and the
   * same groups the American Heart Association uses in patient education
   * (from the ATP III total-cholesterol categories):
   *   desirable: under 200 mg/dL
   *   borderline high: 200–239 mg/dL
   *   high: 240 mg/dL and above
   *
   * 240 mg/dL and above stays High (warning). Total cholesterol is not
   * treated as an acute critical result in this app, including very high
   * values, so the strongest label is reserved for glucose, hemoglobin,
   * and platelets.
   *
   * Those sources do not define a "too low" total. Under 100 mg/dL is
   * unusually low in adults and is labeled Low (warning) rather than
   * desirable, so a missed decimal or a real very-low result is not
   * shown as normal.
   */
  cholesterol: {
    unusuallyLowBelowMgDl: 100,
    borderlineAtOrAboveMgDl: 200,
    highAtOrAboveMgDl: 240,
    input: { min: 20, max: 1000 },
  },
  /**
   * Platelets, K/uL (× 10³/µL).
   *
   * A usual adult complete-blood-count interval is 150–400 × 10³/µL.
   * Some laboratories extend the top to 450; this app keeps 400.
   *
   * Below the usual range and down to 50 is Low (warning). Under 50 is
   * Very low (critical): severe thrombocytopenia, where bleeding risk is
   * discussed in hematology references. Above 400 through 1000 is High
   * (warning). Above 1000 is Very high (critical): extreme thrombocytosis.
   */
  platelets: {
    veryLowBelowKUl: 50,
    normalMinKUl: 150,
    normalMaxKUl: 400,
    veryHighAboveKUl: 1000,
    input: { min: 1, max: 2000 },
  },
} as const;

function assessment(severity: ReadingStatus, label: string): ReadingAssessment {
  return { severity, label };
}

function assessGlucose(value: number, isFasting: boolean): ReadingAssessment {
  const glucose = REFERENCE_RANGES.glucose;
  if (value < glucose.veryLowBelowMgDl) {
    return assessment("critical", "Very low");
  }
  if (value >= glucose.veryHighAtOrAboveMgDl) {
    return assessment("critical", "Very high");
  }
  if (value < glucose.normalAtOrAboveMgDl) {
    return assessment("warning", "Low");
  }
  const context = isFasting ? glucose.fasting : glucose.nonFasting;
  if (value < context.elevatedAtOrAboveMgDl) {
    return assessment("normal", "Normal");
  }
  if (value < context.highAtOrAboveMgDl) {
    return assessment("warning", "Elevated");
  }
  return assessment("warning", "High");
}

function assessHemoglobin(value: number, sex: ReferenceSex): ReadingAssessment {
  const hemoglobin = REFERENCE_RANGES.hemoglobin;
  if (value < hemoglobin.veryLowBelowGDl) {
    return assessment("critical", "Very low");
  }
  if (value > hemoglobin.veryHighAboveGDl) {
    return assessment("critical", "Very high");
  }
  const usual = hemoglobin.normal[sex];
  if (value < usual.min) {
    return assessment("warning", "Low");
  }
  if (value > usual.max) {
    return assessment("warning", "High");
  }
  return assessment("normal", "Normal");
}

function assessCholesterol(value: number): ReadingAssessment {
  const cholesterol = REFERENCE_RANGES.cholesterol;
  if (value < cholesterol.unusuallyLowBelowMgDl) {
    return assessment("warning", "Low");
  }
  if (value < cholesterol.borderlineAtOrAboveMgDl) {
    return assessment("normal", "Normal");
  }
  if (value < cholesterol.highAtOrAboveMgDl) {
    return assessment("warning", "Borderline");
  }
  return assessment("warning", "High");
}

function assessPlatelets(value: number): ReadingAssessment {
  const platelets = REFERENCE_RANGES.platelets;
  if (value < platelets.veryLowBelowKUl) {
    return assessment("critical", "Very low");
  }
  if (value < platelets.normalMinKUl) {
    return assessment("warning", "Low");
  }
  if (value <= platelets.normalMaxKUl) {
    return assessment("normal", "Normal");
  }
  if (value <= platelets.veryHighAboveKUl) {
    return assessment("warning", "High");
  }
  return assessment("critical", "Very high");
}

/**
 * Status for a stored reading. `canonicalValue` is already in the storage
 * unit. The saved `status` field is ignored so a range edit applies to
 * readings that were logged earlier. Fasting is used only for glucose.
 * Sex is used only for hemoglobin; omit it for the combined adult range.
 */
export function assessReading(input: {
  type: ReadingType;
  canonicalValue: number;
  isFasting?: boolean;
  sex?: ReferenceSex;
}): ReadingAssessment {
  if (!Number.isFinite(input.canonicalValue)) {
    return assessment("warning", "Check value");
  }
  switch (input.type) {
    case "glucose":
      return assessGlucose(input.canonicalValue, input.isFasting === true);
    case "hemoglobin":
      return assessHemoglobin(
        input.canonicalValue,
        normalizeReferenceSex(input.sex),
      );
    case "cholesterol":
      return assessCholesterol(input.canonicalValue);
    case "platelets":
      return assessPlatelets(input.canonicalValue);
  }
}

function formatCut(
  type: ReadingType,
  canonicalValue: number,
  system: UnitSystem,
): string {
  return formatMeasurement(type, canonicalValue, system, {
    keepDecimals: true,
  });
}

/** Short usual-range line for the add form and the reading detail. */
export function formatUsualRange(
  type: ReadingType,
  system: UnitSystem,
  context?: { isFasting?: boolean; sex?: ReferenceSex },
): string {
  const unit = displayUnitFor(type, system);
  switch (type) {
    case "glucose": {
      const glucose = REFERENCE_RANGES.glucose;
      const low = formatCut(type, glucose.normalAtOrAboveMgDl, system);
      if (context?.isFasting) {
        const upper = formatCut(
          type,
          glucose.fasting.elevatedAtOrAboveMgDl - 1,
          system,
        );
        return `Usual fasting range: ${low} - ${upper} ${unit}. Under ${low} is low.`;
      }
      const under = formatCut(
        type,
        glucose.nonFasting.elevatedAtOrAboveMgDl,
        system,
      );
      return `Usual range: under ${under} ${unit}. Under ${low} is low.`;
    }
    case "hemoglobin": {
      const sex = normalizeReferenceSex(context?.sex);
      const usual = REFERENCE_RANGES.hemoglobin.normal[sex];
      return `Usual range: ${formatCut(type, usual.min, system)} - ${formatCut(type, usual.max, system)} ${unit}`;
    }
    case "cholesterol": {
      const cholesterol = REFERENCE_RANGES.cholesterol;
      const desirable = formatCut(
        type,
        cholesterol.borderlineAtOrAboveMgDl,
        system,
      );
      const low = formatCut(type, cholesterol.unusuallyLowBelowMgDl, system);
      return `Desirable: under ${desirable} ${unit}. Under ${low} is marked low.`;
    }
    case "platelets": {
      const platelets = REFERENCE_RANGES.platelets;
      return `Usual range: ${formatCut(type, platelets.normalMinKUl, system)} - ${formatCut(type, platelets.normalMaxKUl, system)} ${unit}`;
    }
  }
}
