import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  inspectStoredReadings,
  parseStoredPreferences,
  parseStoredReadings,
} from "./storageParse";

describe("parseStoredReadings", () => {
  it("returns an empty list instead of throwing when storage is not a readings array", () => {
    assert.deepEqual(parseStoredReadings(null), []);
    assert.deepEqual(parseStoredReadings(""), []);
    assert.deepEqual(parseStoredReadings("not json"), []);
    assert.deepEqual(parseStoredReadings("null"), []);
    assert.deepEqual(parseStoredReadings('{"id":"1"}'), []);
    assert.equal(inspectStoredReadings("not json").unreadable, true);
    assert.equal(inspectStoredReadings("[]").unreadable, false);
  });

  it("keeps valid readings and drops entries that would crash the UI", () => {
    const raw = JSON.stringify([
      {
        id: "ok",
        type: "glucose",
        value: 90,
        timestamp: 20,
        unit: "mg/dL",
        status: "normal",
        notes: "morning",
      },
      { id: "bad-type", type: "insulin", value: 1, timestamp: 10 },
      { nope: true },
      { id: "bad-value", type: "glucose", value: "high", timestamp: 30 },
    ]);
    const readings = parseStoredReadings(raw);
    assert.equal(readings.length, 1);
    assert.equal(readings[0]?.id, "ok");
    assert.equal(readings[0]?.notes, "morning");
  });
});

describe("parseStoredPreferences", () => {
  it("falls back to defaults when the payload cannot be trusted", () => {
    assert.equal(parseStoredPreferences("{").displayName, "User");
    assert.equal(parseStoredPreferences("[]").units, "mg/dL");
    const parsed = parseStoredPreferences(
      JSON.stringify({
        displayName: "  Ada  ",
        units: "nope",
        referenceSex: "female",
        notificationsEnabled: "yes",
        avatarIndex: 9,
      }),
    );
    assert.equal(parsed.displayName, "Ada");
    assert.equal(parsed.units, "mg/dL");
    assert.equal(parsed.referenceSex, "female");
    assert.equal(parsed.notificationsEnabled, false);
    assert.equal(parsed.avatarIndex, 0);
  });
});
