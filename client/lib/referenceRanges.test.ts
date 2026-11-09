import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  REFERENCE_RANGE_NOTE,
  REFERENCE_RANGES,
  assessReading,
  formatUsualRange,
} from "./referenceRanges";
import { toCanonicalValue } from "./units";

import type { ReadingStatus, ReferenceSex } from "@/types";

function glucose(canonicalMgDl: number, isFasting?: boolean) {
  return assessReading({
    type: "glucose",
    canonicalValue: canonicalMgDl,
    isFasting,
  });
}

function glucoseFromDisplay(
  displayValue: number,
  system: "mg/dL" | "mmol/L",
  isFasting?: boolean,
) {
  return glucose(toCanonicalValue("glucose", displayValue, system), isFasting);
}

describe("reference range constants", () => {
  it("keeps the cited glucose cuts", () => {
    assert.equal(REFERENCE_RANGES.glucose.veryLowBelowMgDl, 54);
    assert.equal(REFERENCE_RANGES.glucose.normalAtOrAboveMgDl, 70);
    assert.equal(REFERENCE_RANGES.glucose.veryHighAtOrAboveMgDl, 300);
    assert.equal(REFERENCE_RANGES.glucose.fasting.elevatedAtOrAboveMgDl, 100);
    assert.equal(REFERENCE_RANGES.glucose.fasting.highAtOrAboveMgDl, 126);
    assert.equal(
      REFERENCE_RANGES.glucose.nonFasting.elevatedAtOrAboveMgDl,
      140,
    );
    assert.equal(REFERENCE_RANGES.glucose.nonFasting.highAtOrAboveMgDl, 200);
  });

  it("keeps the cited hemoglobin, cholesterol, and platelet cuts", () => {
    assert.deepEqual(REFERENCE_RANGES.hemoglobin.normal.female, {
      min: 12,
      max: 15.5,
    });
    assert.deepEqual(REFERENCE_RANGES.hemoglobin.normal.male, {
      min: 13.5,
      max: 17.5,
    });
    assert.deepEqual(REFERENCE_RANGES.hemoglobin.normal.unspecified, {
      min: 12,
      max: 17,
    });
    assert.equal(REFERENCE_RANGES.hemoglobin.veryLowBelowGDl, 7);
    assert.equal(REFERENCE_RANGES.hemoglobin.veryHighAboveGDl, 20);
    assert.equal(REFERENCE_RANGES.cholesterol.unusuallyLowBelowMgDl, 100);
    assert.equal(REFERENCE_RANGES.cholesterol.borderlineAtOrAboveMgDl, 200);
    assert.equal(REFERENCE_RANGES.cholesterol.highAtOrAboveMgDl, 240);
    assert.equal(REFERENCE_RANGES.platelets.normalMinKUl, 150);
    assert.equal(REFERENCE_RANGES.platelets.normalMaxKUl, 400);
    assert.equal(REFERENCE_RANGES.platelets.veryLowBelowKUl, 50);
    assert.equal(REFERENCE_RANGES.platelets.veryHighAboveKUl, 1000);
  });

  it("states that ranges are not medical advice", () => {
    assert.match(REFERENCE_RANGE_NOTE, /not medical advice/i);
    assert.match(REFERENCE_RANGE_NOTE, /clinician/i);
  });
});

describe("glucose status", () => {
  const cases: {
    value: number;
    fasting: boolean;
    severity: ReadingStatus;
    label: string;
  }[] = [
    { value: 53.9, fasting: true, severity: "critical", label: "Very low" },
    { value: 54, fasting: true, severity: "warning", label: "Low" },
    { value: 69.9, fasting: false, severity: "warning", label: "Low" },
    { value: 70, fasting: true, severity: "normal", label: "Normal" },
    { value: 99, fasting: true, severity: "normal", label: "Normal" },
    { value: 99.9, fasting: true, severity: "normal", label: "Normal" },
    { value: 100, fasting: true, severity: "warning", label: "Elevated" },
    { value: 125, fasting: true, severity: "warning", label: "Elevated" },
    { value: 125.9, fasting: true, severity: "warning", label: "Elevated" },
    { value: 126, fasting: true, severity: "warning", label: "High" },
    { value: 150, fasting: true, severity: "warning", label: "High" },
    { value: 70, fasting: false, severity: "normal", label: "Normal" },
    { value: 110, fasting: false, severity: "normal", label: "Normal" },
    { value: 139.9, fasting: false, severity: "normal", label: "Normal" },
    { value: 140, fasting: false, severity: "warning", label: "Elevated" },
    { value: 150, fasting: false, severity: "warning", label: "Elevated" },
    { value: 199.9, fasting: false, severity: "warning", label: "Elevated" },
    { value: 200, fasting: false, severity: "warning", label: "High" },
    { value: 250, fasting: false, severity: "warning", label: "High" },
    { value: 250, fasting: true, severity: "warning", label: "High" },
    { value: 299.9, fasting: false, severity: "warning", label: "High" },
    { value: 300, fasting: false, severity: "critical", label: "Very high" },
    { value: 300, fasting: true, severity: "critical", label: "Very high" },
  ];

  for (const testCase of cases) {
    it(`${testCase.value} mg/dL fasting=${testCase.fasting} is ${testCase.label}`, () => {
      assert.deepEqual(glucose(testCase.value, testCase.fasting), {
        severity: testCase.severity,
        label: testCase.label,
      });
    });
  }

  it("treats a missing fasting flag as non-fasting", () => {
    assert.deepEqual(glucose(150, undefined), {
      severity: "warning",
      label: "Elevated",
    });
  });

  const mmolCases: {
    display: number;
    fasting: boolean;
    severity: ReadingStatus;
    label: string;
  }[] = [
    { display: 2.9, fasting: true, severity: "critical", label: "Very low" },
    { display: 3.0, fasting: true, severity: "warning", label: "Low" },
    { display: 3.8, fasting: true, severity: "warning", label: "Low" },
    { display: 3.9, fasting: true, severity: "normal", label: "Normal" },
    { display: 5.5, fasting: true, severity: "normal", label: "Normal" },
    { display: 5.6, fasting: true, severity: "warning", label: "Elevated" },
    { display: 6.9, fasting: true, severity: "warning", label: "Elevated" },
    { display: 7.0, fasting: true, severity: "warning", label: "High" },
    { display: 7.7, fasting: false, severity: "normal", label: "Normal" },
    { display: 7.8, fasting: false, severity: "warning", label: "Elevated" },
    { display: 8.3, fasting: false, severity: "warning", label: "Elevated" },
    { display: 11.1, fasting: false, severity: "warning", label: "Elevated" },
    { display: 11.2, fasting: false, severity: "warning", label: "High" },
    { display: 16.6, fasting: false, severity: "warning", label: "High" },
    { display: 16.7, fasting: true, severity: "critical", label: "Very high" },
  ];

  for (const testCase of mmolCases) {
    it(`${testCase.display} mmol/L fasting=${testCase.fasting} is ${testCase.label}`, () => {
      assert.deepEqual(
        glucoseFromDisplay(testCase.display, "mmol/L", testCase.fasting),
        { severity: testCase.severity, label: testCase.label },
      );
    });
  }

  it("scores the same mg/dL value whether it was typed in mg/dL", () => {
    assert.deepEqual(
      glucoseFromDisplay(150, "mg/dL", false),
      glucose(150, false),
    );
  });
});

describe("hemoglobin status", () => {
  const cases: {
    value: number;
    sex: ReferenceSex;
    severity: ReadingStatus;
    label: string;
  }[] = [
    { value: 6.9, sex: "female", severity: "critical", label: "Very low" },
    { value: 6.9, sex: "male", severity: "critical", label: "Very low" },
    { value: 7, sex: "female", severity: "warning", label: "Low" },
    { value: 7, sex: "unspecified", severity: "warning", label: "Low" },
    { value: 11.9, sex: "female", severity: "warning", label: "Low" },
    { value: 12, sex: "female", severity: "normal", label: "Normal" },
    { value: 12, sex: "unspecified", severity: "normal", label: "Normal" },
    { value: 13, sex: "female", severity: "normal", label: "Normal" },
    { value: 13, sex: "male", severity: "warning", label: "Low" },
    { value: 13, sex: "unspecified", severity: "normal", label: "Normal" },
    { value: 13.4, sex: "male", severity: "warning", label: "Low" },
    { value: 13.5, sex: "male", severity: "normal", label: "Normal" },
    { value: 15.5, sex: "female", severity: "normal", label: "Normal" },
    { value: 15.6, sex: "female", severity: "warning", label: "High" },
    { value: 16, sex: "female", severity: "warning", label: "High" },
    { value: 16, sex: "male", severity: "normal", label: "Normal" },
    { value: 16, sex: "unspecified", severity: "normal", label: "Normal" },
    { value: 17, sex: "unspecified", severity: "normal", label: "Normal" },
    { value: 17.1, sex: "unspecified", severity: "warning", label: "High" },
    { value: 17.2, sex: "male", severity: "normal", label: "Normal" },
    { value: 17.2, sex: "female", severity: "warning", label: "High" },
    { value: 17.5, sex: "male", severity: "normal", label: "Normal" },
    { value: 17.6, sex: "male", severity: "warning", label: "High" },
    { value: 20, sex: "male", severity: "warning", label: "High" },
    { value: 20, sex: "female", severity: "warning", label: "High" },
    { value: 20.1, sex: "female", severity: "critical", label: "Very high" },
    {
      value: 20.1,
      sex: "unspecified",
      severity: "critical",
      label: "Very high",
    },
  ];

  for (const testCase of cases) {
    it(`${testCase.value} g/dL ${testCase.sex} is ${testCase.label}`, () => {
      assert.deepEqual(
        assessReading({
          type: "hemoglobin",
          canonicalValue: testCase.value,
          sex: testCase.sex,
        }),
        { severity: testCase.severity, label: testCase.label },
      );
    });
  }

  it("uses the combined range when sex is omitted", () => {
    assert.equal(
      assessReading({ type: "hemoglobin", canonicalValue: 17 }).label,
      "Normal",
    );
    assert.equal(
      assessReading({ type: "hemoglobin", canonicalValue: 17.1 }).label,
      "High",
    );
  });
});

describe("cholesterol status", () => {
  const cases: {
    mgDl: number;
    severity: ReadingStatus;
    label: string;
  }[] = [
    { mgDl: 0, severity: "warning", label: "Low" },
    { mgDl: 50, severity: "warning", label: "Low" },
    { mgDl: 99.9, severity: "warning", label: "Low" },
    { mgDl: 100, severity: "normal", label: "Normal" },
    { mgDl: 199.9, severity: "normal", label: "Normal" },
    { mgDl: 200, severity: "warning", label: "Borderline" },
    { mgDl: 239.9, severity: "warning", label: "Borderline" },
    { mgDl: 240, severity: "warning", label: "High" },
    { mgDl: 400, severity: "warning", label: "High" },
    { mgDl: 5000, severity: "warning", label: "High" },
  ];

  for (const testCase of cases) {
    it(`${testCase.mgDl} mg/dL is ${testCase.label}`, () => {
      assert.deepEqual(
        assessReading({ type: "cholesterol", canonicalValue: testCase.mgDl }),
        { severity: testCase.severity, label: testCase.label },
      );
      assert.notEqual(testCase.severity, "critical");
    });
  }

  const mmolCases: { display: number; label: string }[] = [
    { display: 2.58, label: "Low" },
    { display: 2.59, label: "Normal" },
    { display: 5.17, label: "Normal" },
    { display: 5.18, label: "Borderline" },
    { display: 6.2, label: "Borderline" },
    { display: 6.21, label: "High" },
  ];

  for (const testCase of mmolCases) {
    it(`${testCase.display} mmol/L is ${testCase.label}`, () => {
      const canonical = toCanonicalValue(
        "cholesterol",
        testCase.display,
        "mmol/L",
      );
      const result = assessReading({
        type: "cholesterol",
        canonicalValue: canonical,
      });
      assert.equal(result.label, testCase.label);
      assert.notEqual(result.severity, "critical");
    });
  }
});

describe("platelet status", () => {
  const cases: {
    value: number;
    severity: ReadingStatus;
    label: string;
  }[] = [
    { value: 49.9, severity: "critical", label: "Very low" },
    { value: 50, severity: "warning", label: "Low" },
    { value: 149.9, severity: "warning", label: "Low" },
    { value: 150, severity: "normal", label: "Normal" },
    { value: 400, severity: "normal", label: "Normal" },
    { value: 400.1, severity: "warning", label: "High" },
    { value: 1000, severity: "warning", label: "High" },
    { value: 1000.1, severity: "critical", label: "Very high" },
  ];

  for (const testCase of cases) {
    it(`${testCase.value} K/uL is ${testCase.label}`, () => {
      assert.deepEqual(
        assessReading({ type: "platelets", canonicalValue: testCase.value }),
        { severity: testCase.severity, label: testCase.label },
      );
    });
  }

  it("does not convert platelets when the preference is mmol/L", () => {
    const canonical = toCanonicalValue("platelets", 150, "mmol/L");
    assert.equal(canonical, 150);
    assert.equal(
      assessReading({ type: "platelets", canonicalValue: canonical }).label,
      "Normal",
    );
  });
});

describe("usual range text", () => {
  it("describes glucose in both units and both contexts", () => {
    assert.equal(
      formatUsualRange("glucose", "mg/dL", { isFasting: true }),
      "Usual fasting range: 70 - 99 mg/dL. Under 70 is low.",
    );
    assert.equal(
      formatUsualRange("glucose", "mg/dL", { isFasting: false }),
      "Usual range: under 140 mg/dL. Under 70 is low.",
    );
    assert.equal(
      formatUsualRange("glucose", "mmol/L", { isFasting: true }),
      "Usual fasting range: 3.9 - 5.5 mmol/L. Under 3.9 is low.",
    );
    assert.equal(
      formatUsualRange("glucose", "mmol/L"),
      "Usual range: under 7.8 mmol/L. Under 3.9 is low.",
    );
  });

  it("describes hemoglobin by sex and cholesterol in both units", () => {
    assert.equal(
      formatUsualRange("hemoglobin", "mg/dL", { sex: "female" }),
      "Usual range: 12.0 - 15.5 g/dL",
    );
    assert.equal(
      formatUsualRange("hemoglobin", "mmol/L", { sex: "male" }),
      "Usual range: 13.5 - 17.5 g/dL",
    );
    assert.equal(
      formatUsualRange("hemoglobin", "mg/dL"),
      "Usual range: 12.0 - 17.0 g/dL",
    );
    assert.equal(
      formatUsualRange("cholesterol", "mg/dL"),
      "Desirable: under 200 mg/dL. Under 100 is marked low.",
    );
    assert.equal(
      formatUsualRange("cholesterol", "mmol/L"),
      "Desirable: under 5.17 mmol/L. Under 2.59 is marked low.",
    );
    assert.equal(
      formatUsualRange("platelets", "mmol/L"),
      "Usual range: 150 - 400 K/uL",
    );
  });
});

describe("corrupt values", () => {
  it("does not call a non-finite value normal", () => {
    assert.deepEqual(
      assessReading({ type: "glucose", canonicalValue: Number.NaN }),
      { severity: "warning", label: "Check value" },
    );
  });
});
