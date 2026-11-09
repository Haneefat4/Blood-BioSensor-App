const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Return HH:MM, or null when the text is not a 24-hour time. */
export function normalizeTime(time: string): string | null {
  const match = TIME_PATTERN.exec(time.trim());
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function minutesSinceMidnight(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Normalize, drop invalid entries, and order by clock time rather than text. */
export function sortTimes(times: string[]): string[] {
  const unique = new Set<string>();
  for (const time of times) {
    const normalized = normalizeTime(time);
    if (normalized) unique.add(normalized);
  }
  return [...unique].sort(
    (a, b) => minutesSinceMidnight(a) - minutesSinceMidnight(b),
  );
}
