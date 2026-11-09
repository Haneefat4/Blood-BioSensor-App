import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseReadingValue, validateReadingInput } from "./readingValue";
import { assessReading } from "./referenceRanges";

describe("parseReadingValue", () => {
  it("accepts a comma or a period as the decimal separator", () => {
    assert.equal(parseReadingValue("5,5"), 5.5);
    assert.equal(parseReadingValue("5.5"), 5.5);
    assert.equal(parseReadingValue("  8,25 "), 8.25);
    assert.equal(parseReadingValue(",5"), 0.5);
    assert.equal(parseReadingValue(".5"), 0.5);
    assert.equal(parseReadingValue("12"), 12);
    assert.equal(parseReadingValue("0070"), 70);
  });

  it("rejects trailing junk, signs, exponents, and extra separators", () => {
    assert.equal(parseReadingValue("12abc"), null);
    assert.equal(parseReadingValue("1e2"), null);
    assert.equal(parseReadingValue("+5"), null);
    assert.equal(parseReadingValue("-3"), null);
    assert.equal(parseReadingValue("5,"), null);
    assert.equal(parseReadingValue("5."), null);
    assert.equal(parseReadingValue("1.2.3"), null);
    assert.equal(parseReadingValue("5,5,5"), null);
    assert.equal(parseReadingValue("5 5"), null);
    assert.equal(parseReadingValue(""), null);
    assert.equal(parseReadingValue("   "), null);
  });

  it("treats a comma as a decimal mark, not a thousands separator", () => {
    assert.equal(parseReadingValue("1,000"), 1);
  });
});

describe("validateReadingInput", () => {
  it("explains an empty value and a value that is not a plain number", () => {
    assert.deepEqual(validateReadingInput("", "glucose", "mg/dL"), {
      ok: false,
      message: "Enter a number.",
    });
    assert.deepEqual(validateReadingInput("12abc", "glucose", "mg/dL"), {
      ok: false,
      message: "Enter a number. Use a comma or a period for the decimal.",
    });
    assert.deepEqual(validateReadingInput("5,", "hemoglobin", "mg/dL"), {
      ok: false,
      message: "Enter a number. Use a comma or a period for the decimal.",
    });
  });

  it("accepts a comma decimal and converts glucose into mg/dL", () => {
    const result = validateReadingInput("5,5", "glucose", "mmol/L");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.displayValue, 5.5);
    assert.ok(Math.abs(result.canonicalValue - 99.088) < 1e-9);
    assert.deepEqual(
      assessReading({
        type: "glucose",
        canonicalValue: result.canonicalValue,
        isFasting: true,
      }),
      { severity: "normal", label: "Normal" },
    );
  });

  it("rejects glucose outside the meter window in either unit", () => {
    assert.equal(validateReadingInput("10", "glucose", "mg/dL").ok, true);
    assert.equal(validateReadingInput("600", "glucose", "mg/dL").ok, true);
    assert.deepEqual(validateReadingInput("9.9", "glucose", "mg/dL"), {
      ok: false,
      message: "Enter a glucose value from 10 to 600 mg/dL.",
    });
    assert.deepEqual(validateReadingInput("99999", "glucose", "mg/dL"), {
      ok: false,
      message: "Enter a glucose value from 10 to 600 mg/dL.",
    });
    assert.equal(validateReadingInput("0,6", "glucose", "mmol/L").ok, true);
    assert.equal(validateReadingInput("33,3", "glucose", "mmol/L").ok, true);
    assert.deepEqual(validateReadingInput("0,5", "glucose", "mmol/L"), {
      ok: false,
      message: "Enter a glucose value from 0.6 to 33.3 mmol/L.",
    });
    assert.deepEqual(validateReadingInput("34", "glucose", "mmol/L"), {
      ok: false,
      message: "Enter a glucose value from 0.6 to 33.3 mmol/L.",
    });
  });

  it("keeps hemoglobin and platelet limits in their own units", () => {
    assert.equal(validateReadingInput("12,5", "hemoglobin", "mmol/L").ok, true);
    assert.deepEqual(validateReadingInput("0,9", "hemoglobin", "mg/dL"), {
      ok: false,
      message: "Enter a hemoglobin value from 1.0 to 25.0 g/dL.",
    });
    assert.deepEqual(validateReadingInput("25.1", "hemoglobin", "mmol/L"), {
      ok: false,
      message: "Enter a hemoglobin value from 1.0 to 25.0 g/dL.",
    });
    assert.equal(validateReadingInput("1", "platelets", "mmol/L").ok, true);
    assert.equal(validateReadingInput("2000", "platelets", "mg/dL").ok, true);
    assert.deepEqual(validateReadingInput("0,5", "platelets", "mmol/L"), {
      ok: false,
      message: "Enter a platelets value from 1 to 2000 K/uL.",
    });
    assert.deepEqual(validateReadingInput("2001", "platelets", "mg/dL"), {
      ok: false,
      message: "Enter a platelets value from 1 to 2000 K/uL.",
    });
  });

  it("applies cholesterol limits in the selected unit", () => {
    const typed = validateReadingInput("5,5", "cholesterol", "mmol/L");
    assert.equal(typed.ok, true);
    if (!typed.ok) return;
    assert.equal(
      assessReading({
        type: "cholesterol",
        canonicalValue: typed.canonicalValue,
      }).label,
      "Borderline",
    );
    assert.deepEqual(validateReadingInput("5,5", "cholesterol", "mg/dL"), {
      ok: false,
      message: "Enter a cholesterol value from 20 to 1000 mg/dL.",
    });
    assert.equal(
      validateReadingInput("25.86", "cholesterol", "mmol/L").ok,
      true,
    );
    assert.deepEqual(validateReadingInput("26", "cholesterol", "mmol/L"), {
      ok: false,
      message: "Enter a cholesterol value from 0.52 to 25.86 mmol/L.",
    });
  });
});
