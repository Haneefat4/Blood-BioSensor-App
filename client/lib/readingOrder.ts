import type { Reading, ReadingType } from "@/types";
import { READING_CONFIG, READING_TAGS } from "@/types";

export function startOfLocalDay(value: number | Date): Date {
  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Today and the previous six local midnights, through `now`. */
export function sevenDayWindow(now: number): { start: number; end: number } {
  const start = startOfLocalDay(now);
  start.setDate(start.getDate() - 6);
  return { start: start.getTime(), end: now };
}

/** Today and the previous 29 local midnights, through `now`. */
export function thirtyDayWindow(now: number): { start: number; end: number } {
  const start = startOfLocalDay(now);
  start.setDate(start.getDate() - 29);
  return { start: start.getTime(), end: now };
}

/**
 * Highest timestamp wins, regardless of array order.
 * If two items share that timestamp, the earlier one in the array is kept.
 */
export function latestReading<T extends { timestamp: number }>(
  items: readonly T[],
  predicate?: (item: T) => boolean,
): T | undefined {
  let latest: T | undefined;
  for (const item of items) {
    if (predicate && !predicate(item)) continue;
    if (!latest || item.timestamp > latest.timestamp) {
      latest = item;
    }
  }
  return latest;
}

export function sortReadingsByTimestampDesc<T extends { timestamp: number }>(
  items: readonly T[],
): T[] {
  return [...items].sort((left, right) => {
    if (right.timestamp !== left.timestamp) {
      return right.timestamp - left.timestamp;
    }
    return 0;
  });
}

export function readingsInSevenDayWindow(
  readings: readonly Reading[],
  type: ReadingType,
  now: number,
): Reading[] {
  const { start, end } = sevenDayWindow(now);
  return readings
    .filter(
      (reading) =>
        reading.type === type &&
        reading.timestamp >= start &&
        reading.timestamp <= end,
    )
    .sort((left, right) => left.timestamp - right.timestamp);
}

export type HistoryRange = "all" | "7" | "30" | "custom";

export function filterReadings(
  readings: readonly Reading[],
  options: {
    type: "all" | ReadingType;
    query: string;
    range: HistoryRange;
    customStart: number | null;
    customEnd: number | null;
    now: number;
  },
): Reading[] {
  let start: number | null = null;
  let end: number | null = null;

  if (options.range === "7") {
    const window = sevenDayWindow(options.now);
    start = window.start;
    end = window.end;
  } else if (options.range === "30") {
    const window = thirtyDayWindow(options.now);
    start = window.start;
    end = window.end;
  } else if (options.range === "custom") {
    if (options.customStart != null) {
      start = startOfLocalDay(options.customStart).getTime();
    }
    if (options.customEnd != null) {
      const endDay = startOfLocalDay(options.customEnd);
      endDay.setDate(endDay.getDate() + 1);
      end = endDay.getTime() - 1;
    }
  }

  if (start != null && end != null && start > end) {
    return [];
  }

  const query = options.query.trim().toLowerCase();

  return sortReadingsByTimestampDesc(
    readings.filter((reading) => {
      if (options.type !== "all" && reading.type !== options.type) return false;
      if (start != null && reading.timestamp < start) return false;
      if (end != null && reading.timestamp > end) return false;
      if (!query) return true;
      const tagLabels = (reading.tags ?? [])
        .map(
          (tagId) =>
            READING_TAGS.find((tag) => tag.id === tagId)?.label ?? tagId,
        )
        .join(" ");
      const haystack = [
        READING_CONFIG[reading.type].label,
        String(reading.value),
        reading.notes ?? "",
        reading.unit,
        tagLabels,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    }),
  );
}
