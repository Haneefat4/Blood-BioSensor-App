import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterReadings,
  latestReading,
  readingsInSevenDayWindow,
  sevenDayWindow,
  sortReadingsByTimestampDesc,
} from "./readingOrder";
import type { Reading } from "@/types";

function reading(
  overrides: Partial<Reading> & Pick<Reading, "id" | "timestamp">,
): Reading {
  return {
    type: "glucose",
    value: 90,
    unit: "mg/dL",
    status: "normal",
    ...overrides,
  };
}

describe("latestReading", () => {
  it("picks the newest timestamp instead of the first array item", () => {
    const items = [
      reading({ id: "old", timestamp: 1_000 }),
      reading({ id: "newest", timestamp: 5_000 }),
      reading({ id: "middle", timestamp: 3_000 }),
    ];

    assert.equal(latestReading(items)?.id, "newest");
    assert.equal(
      latestReading(items, (item) => item.id !== "newest")?.id,
      "middle",
    );
  });

  it("keeps the earlier item when timestamps tie", () => {
    const items = [
      reading({ id: "first", timestamp: 5 }),
      reading({ id: "second", timestamp: 5 }),
    ];
    assert.equal(latestReading(items)?.id, "first");
  });
});

describe("sortReadingsByTimestampDesc", () => {
  it("orders newest first without depending on the original array", () => {
    const items = [
      reading({ id: "old", timestamp: 1 }),
      reading({ id: "newest", timestamp: 50 }),
      reading({ id: "middle", timestamp: 20 }),
    ];
    assert.deepEqual(
      sortReadingsByTimestampDesc(items).map((item) => item.id),
      ["newest", "middle", "old"],
    );
    assert.equal(items[0]?.id, "old");
  });
});

describe("readingsInSevenDayWindow", () => {
  it("covers the local calendar span and ignores other types and future times", () => {
    const now = new Date(2026, 10, 9, 15, 30, 0, 0).getTime();
    const window = sevenDayWindow(now);
    const start = new Date(window.start);

    assert.equal(start.getFullYear(), 2026);
    assert.equal(start.getMonth(), 10);
    assert.equal(start.getDate(), 3);
    assert.equal(start.getHours(), 0);
    assert.equal(window.end, now);

    const result = readingsInSevenDayWindow(
      [
        reading({ id: "future", timestamp: now + 1 }),
        reading({ id: "before", timestamp: window.start - 1 }),
        reading({ id: "inside", timestamp: now - 1_000 }),
        reading({ id: "start", timestamp: window.start }),
        reading({
          id: "other-type",
          timestamp: now - 1_000,
          type: "platelets",
        }),
      ],
      "glucose",
      now,
    );

    assert.deepEqual(
      result.map((item) => item.id),
      ["start", "inside"],
    );
  });
});

describe("filterReadings", () => {
  it("matches notes and a custom date range, newest first", () => {
    const now = new Date(2026, 10, 9, 12, 0, 0, 0).getTime();
    const older = new Date(2026, 9, 1, 8, 0, 0, 0).getTime();
    const recent = new Date(2026, 10, 8, 8, 0, 0, 0).getTime();
    const readings = [
      reading({ id: "old-note", timestamp: older, notes: "clinic visit" }),
      reading({
        id: "recent-note",
        timestamp: recent,
        notes: "Clinic follow up",
      }),
      reading({ id: "recent-other", timestamp: recent + 10, notes: "home" }),
    ];

    const filtered = filterReadings(readings, {
      type: "all",
      query: "clinic",
      range: "custom",
      customStart: new Date(2026, 10, 1).getTime(),
      customEnd: new Date(2026, 10, 9).getTime(),
      now,
    });

    assert.deepEqual(
      filtered.map((item) => item.id),
      ["recent-note"],
    );
  });
});
