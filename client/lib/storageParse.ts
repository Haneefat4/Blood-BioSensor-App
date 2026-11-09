import { normalizeTime, sortTimes } from "@/lib/reminderTimes";
import type {
  Medication,
  Reading,
  ReadingStatus,
  ReadingTag,
  ReadingType,
  UserPreferences,
} from "@/types";
import {
  DEFAULT_USER_PREFERENCES,
  normalizeReferenceSex,
  READING_CONFIG,
  READING_TAGS,
} from "@/types";

const READING_TYPES: readonly ReadingType[] = [
  "glucose",
  "hemoglobin",
  "cholesterol",
  "platelets",
];
const READING_STATUSES: readonly ReadingStatus[] = [
  "normal",
  "warning",
  "critical",
];
const TAG_IDS = new Set<ReadingTag>(READING_TAGS.map((tag) => tag.id));

export interface ParsedReadings {
  readings: Reading[];
  /** True when a saved payload exists but is not a readings array. */
  unreadable: boolean;
}

export interface ParsedMedications {
  medications: Medication[];
  unreadable: boolean;
}

function parseJson(raw: string | null): { value: unknown; failed: boolean } {
  if (raw == null || raw.trim() === "") {
    return { value: null, failed: false };
  }
  try {
    return { value: JSON.parse(raw), failed: false };
  } catch {
    return { value: null, failed: true };
  }
}

function isReadingType(value: unknown): value is ReadingType {
  return READING_TYPES.includes(value as ReadingType);
}

function coerceReading(value: unknown): Reading | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<Reading>;
  if (typeof record.id !== "string" || record.id.length === 0) return null;
  if (!isReadingType(record.type)) return null;
  if (typeof record.value !== "number" || !Number.isFinite(record.value))
    return null;
  if (
    typeof record.timestamp !== "number" ||
    !Number.isFinite(record.timestamp)
  ) {
    return null;
  }

  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag): tag is ReadingTag =>
        TAG_IDS.has(tag as ReadingTag),
      )
    : undefined;

  return {
    id: record.id,
    type: record.type,
    value: record.value,
    unit:
      typeof record.unit === "string" && record.unit.length > 0
        ? record.unit
        : READING_CONFIG[record.type].defaultUnit,
    timestamp: record.timestamp,
    notes: typeof record.notes === "string" ? record.notes : undefined,
    status: READING_STATUSES.includes(record.status as ReadingStatus)
      ? (record.status as ReadingStatus)
      : "normal",
    isFasting: record.isFasting === true,
    tags: tags && tags.length > 0 ? tags : undefined,
    photoUri:
      typeof record.photoUri === "string" && record.photoUri.length > 0
        ? record.photoUri
        : undefined,
  };
}

export function inspectStoredReadings(raw: string | null): ParsedReadings {
  const parsed = parseJson(raw);
  if (parsed.failed) return { readings: [], unreadable: true };
  if (parsed.value == null) return { readings: [], unreadable: false };
  if (!Array.isArray(parsed.value)) return { readings: [], unreadable: true };

  const readings = parsed.value
    .map((item) => coerceReading(item))
    .filter((item): item is Reading => item !== null);
  return { readings, unreadable: false };
}

export function parseStoredReadings(raw: string | null): Reading[] {
  return inspectStoredReadings(raw).readings;
}

function coerceMedication(value: unknown): Medication | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<Medication>;
  if (typeof record.id !== "string" || record.id.length === 0) return null;
  if (typeof record.name !== "string") return null;
  if (typeof record.dosage !== "string") return null;
  if (typeof record.frequency !== "string") return null;
  if (
    typeof record.createdAt !== "number" ||
    !Number.isFinite(record.createdAt)
  ) {
    return null;
  }
  return {
    id: record.id,
    name: record.name,
    dosage: record.dosage,
    frequency: record.frequency,
    time: typeof record.time === "string" ? record.time : undefined,
    notes: typeof record.notes === "string" ? record.notes : undefined,
    createdAt: record.createdAt,
  };
}

export function inspectStoredMedications(
  raw: string | null,
): ParsedMedications {
  const parsed = parseJson(raw);
  if (parsed.failed) return { medications: [], unreadable: true };
  if (parsed.value == null) return { medications: [], unreadable: false };
  if (!Array.isArray(parsed.value))
    return { medications: [], unreadable: true };
  return {
    medications: parsed.value
      .map((item) => coerceMedication(item))
      .filter((item): item is Medication => item !== null),
    unreadable: false,
  };
}

function reminderSettingsFrom(
  value: unknown,
): UserPreferences["reminderSettings"] {
  const fallback = DEFAULT_USER_PREFERENCES.reminderSettings;
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fallback;
  const record = value as {
    enabled?: unknown;
    times?: unknown;
    types?: unknown;
  };
  const times = Array.isArray(record.times)
    ? sortTimes(
        record.times
          .map((time) =>
            typeof time === "string" ? normalizeTime(time) : null,
          )
          .filter((time): time is string => time !== null),
      )
    : [];
  const types = Array.isArray(record.types)
    ? record.types.filter((type): type is ReadingType => isReadingType(type))
    : [];
  return {
    enabled: record.enabled === true,
    times: times.length > 0 ? times : (fallback?.times ?? ["09:00", "21:00"]),
    types: types.length > 0 ? types : (fallback?.types ?? ["glucose"]),
  };
}

export function parseStoredPreferences(raw: string | null): UserPreferences {
  const parsed = parseJson(raw);
  if (
    parsed.failed ||
    !parsed.value ||
    typeof parsed.value !== "object" ||
    Array.isArray(parsed.value)
  ) {
    return DEFAULT_USER_PREFERENCES;
  }
  const record = parsed.value as Partial<UserPreferences>;
  const displayName =
    typeof record.displayName === "string" &&
    record.displayName.trim().length > 0
      ? record.displayName.trim()
      : DEFAULT_USER_PREFERENCES.displayName;
  const avatarIndex =
    typeof record.avatarIndex === "number" &&
    Number.isInteger(record.avatarIndex) &&
    record.avatarIndex >= 0 &&
    record.avatarIndex <= 3
      ? record.avatarIndex
      : DEFAULT_USER_PREFERENCES.avatarIndex;
  const darkMode =
    record.darkMode === "light" ||
    record.darkMode === "dark" ||
    record.darkMode === "system"
      ? record.darkMode
      : DEFAULT_USER_PREFERENCES.darkMode;

  return {
    displayName,
    avatarIndex,
    units: record.units === "mmol/L" ? "mmol/L" : "mg/dL",
    referenceSex: normalizeReferenceSex(record.referenceSex),
    darkMode,
    notificationsEnabled: record.notificationsEnabled === true,
    reminderSettings: reminderSettingsFrom(record.reminderSettings),
  };
}
