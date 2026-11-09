export type ReadingType =
  | "glucose"
  | "hemoglobin"
  | "cholesterol"
  | "platelets";

export type ReadingStatus = "normal" | "warning" | "critical";

/** Used only to pick a hemoglobin reference interval. */
export type ReferenceSex = "female" | "male" | "unspecified";

export function normalizeReferenceSex(value: unknown): ReferenceSex {
  if (value === "female" || value === "male" || value === "unspecified") {
    return value;
  }
  return "unspecified";
}

export type ReadingTag =
  | "fasting"
  | "after_meal"
  | "before_meal"
  | "exercise"
  | "medication"
  | "morning"
  | "evening";

export const READING_TAGS: { id: ReadingTag; label: string; icon: string }[] = [
  { id: "fasting", label: "Fasting", icon: "clock" },
  { id: "after_meal", label: "After Meal", icon: "coffee" },
  { id: "before_meal", label: "Before Meal", icon: "sunrise" },
  { id: "exercise", label: "After Exercise", icon: "activity" },
  { id: "medication", label: "With Medication", icon: "plus-circle" },
  { id: "morning", label: "Morning", icon: "sun" },
  { id: "evening", label: "Evening", icon: "moon" },
];

export interface Reading {
  id: string;
  type: ReadingType;
  value: number;
  unit: string;
  timestamp: number;
  notes?: string;
  /**
   * Severity recorded when the reading was saved. Home, History, charts,
   * and exports recompute status from client/lib/referenceRanges.ts so a
   * later range change still applies. Do not read this field in the UI.
   */
  status: ReadingStatus;
  isFasting?: boolean;
  tags?: ReadingTag[];
  photoUri?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time?: string;
  notes?: string;
  createdAt: number;
}

export interface ReminderSettings {
  enabled: boolean;
  times: string[];
  types: ReadingType[];
}

export interface UserPreferences {
  displayName: string;
  avatarIndex: number;
  units: "mg/dL" | "mmol/L";
  /**
   * Hemoglobin interval only. Female and male use typical adult ranges.
   * Unspecified uses a combined adult range. Other reading types ignore it.
   */
  referenceSex: ReferenceSex;
  darkMode: "system" | "light" | "dark";
  notificationsEnabled: boolean;
  reminderSettings?: ReminderSettings;
}

/**
 * Labels, icons, and canonical storage units.
 * Status bands and input limits live in client/lib/referenceRanges.ts.
 */
export const READING_CONFIG: Record<
  ReadingType,
  {
    label: string;
    icon: string;
    defaultUnit: string;
  }
> = {
  glucose: {
    label: "Glucose",
    icon: "droplet",
    defaultUnit: "mg/dL",
  },
  hemoglobin: {
    label: "Hemoglobin",
    icon: "heart",
    defaultUnit: "g/dL",
  },
  cholesterol: {
    label: "Cholesterol",
    icon: "activity",
    defaultUnit: "mg/dL",
  },
  platelets: {
    label: "Platelets",
    icon: "trending-up",
    defaultUnit: "K/uL",
  },
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  displayName: "User",
  avatarIndex: 0,
  units: "mg/dL",
  referenceSex: "unspecified",
  darkMode: "system",
  notificationsEnabled: false,
  reminderSettings: {
    enabled: false,
    times: ["09:00", "21:00"],
    types: ["glucose"],
  },
};
