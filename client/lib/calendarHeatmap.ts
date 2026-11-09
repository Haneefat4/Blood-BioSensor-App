import { localDateKey, startOfLocalDay } from "@/lib/readingOrder";

export const HEATMAP_WEEK_COUNT = 12;

/**
 * Sunday-Saturday weeks ending with the week that contains `now`.
 * The last column includes today and the rest of that week.
 *
 * Counting back a fixed number of days and then snapping to Sunday ended the
 * grid on the previous Saturday whenever today was not itself a Saturday, so
 * a reading logged today never appeared.
 */
export function buildHeatmapWeeks(
  now: Date | number,
  weeksToShow: number = HEATMAP_WEEK_COUNT,
): Date[][] {
  const today = startOfLocalDay(now);
  const start = startOfLocalDay(today);
  start.setDate(start.getDate() - start.getDay());
  start.setDate(start.getDate() - (weeksToShow - 1) * 7);

  const weeks: Date[][] = [];
  const cursor = new Date(start.getTime());
  for (let weekIndex = 0; weekIndex < weeksToShow; weekIndex++) {
    const week: Date[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      week.push(new Date(cursor.getTime()));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function heatmapIncludesLocalDay(
  weeks: readonly (readonly Date[])[],
  value: Date | number,
): boolean {
  const key = localDateKey(value);
  return weeks.some((week) => week.some((day) => localDateKey(day) === key));
}
