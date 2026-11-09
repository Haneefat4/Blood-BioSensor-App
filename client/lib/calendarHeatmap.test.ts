import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildHeatmapWeeks,
  HEATMAP_WEEK_COUNT,
  heatmapIncludesLocalDay,
} from "./calendarHeatmap";
import { localDateKey } from "./readingOrder";

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

describe("buildHeatmapWeeks", () => {
  it("includes Monday Nov 9 2026 instead of stopping on the previous Saturday", () => {
    const today = new Date(2026, 10, 9, 18, 30, 0, 0);
    const weeks = buildHeatmapWeeks(today);

    assert.equal(weeks.length, HEATMAP_WEEK_COUNT);
    assert.equal(weeks[0]?.[0]?.getDay(), 0);
    assert.equal(weeks[0]?.[6]?.getDay(), 6);

    const lastWeek = weeks[weeks.length - 1];
    assert.ok(lastWeek);
    assert.equal(localDateKey(lastWeek[0]), "2026-11-08");
    assert.equal(localDateKey(lastWeek[1]), "2026-11-09");
    assert.equal(localDateKey(lastWeek[6]), "2026-11-14");
    assert.equal(heatmapIncludesLocalDay(weeks, today), true);
    assert.equal(
      heatmapIncludesLocalDay(weeks, new Date(2026, 10, 7, 12, 0, 0, 0)),
      true,
    );

    const loggedToday = new Date(2026, 10, 9, 8, 5, 0, 0).getTime();
    const cell = weeks
      .flat()
      .find((day) => localDateKey(day) === localDateKey(loggedToday));
    assert.ok(cell);
    assert.equal(localDateKey(cell), "2026-11-09");
  });

  it("includes today when today is Sunday or Saturday", () => {
    const sunday = new Date(2026, 10, 8, 9, 0, 0, 0);
    const sundayWeeks = buildHeatmapWeeks(sunday);
    const sundayLast = sundayWeeks[sundayWeeks.length - 1];
    assert.equal(localDateKey(sundayLast?.[0] ?? 0), "2026-11-08");
    assert.equal(localDateKey(sundayLast?.[6] ?? 0), "2026-11-14");

    const saturday = new Date(2026, 10, 7, 21, 0, 0, 0);
    const saturdayWeeks = buildHeatmapWeeks(saturday);
    const saturdayLast = saturdayWeeks[saturdayWeeks.length - 1];
    assert.equal(localDateKey(saturdayLast?.[6] ?? 0), "2026-11-07");
    assert.equal(heatmapIncludesLocalDay(saturdayWeeks, saturday), true);
  });

  it("covers consecutive local days, including across a daylight-saving change", () => {
    const now = new Date(2026, 2, 10, 12, 0, 0, 0);
    const days = buildHeatmapWeeks(now).flat();
    assert.equal(days.length, HEATMAP_WEEK_COUNT * 7);
    const first = days[0];
    assert.ok(first);
    days.forEach((day, index) => {
      assert.equal(localDateKey(day), localDateKey(addLocalDays(first, index)));
    });
    assert.equal(
      new Set(days.map((day) => localDateKey(day))).size,
      days.length,
    );
    assert.equal(heatmapIncludesLocalDay([days], now), true);
    const last = days[days.length - 1];
    assert.ok(last);
    assert.ok(localDateKey(last) >= localDateKey(now));
    assert.equal(last.getDay(), 6);
  });
});
