export type ReadingType = "glucose" | "hemoglobin" | "cholesterol" | "platelets";

export type ReadingStatus = "normal" | "warning" | "critical";

export interface Reading {
  id: string;
  type: ReadingType;
  value: number;
  unit: string;
  timestamp: number;
  notes?: string;
  status: ReadingStatus;
}

export interface UserPreferences {
  displayName: string;
  avatarIndex: number;
  units: "mg/dL" | "mmol/L";
  darkMode: "system" | "light" | "dark";
  notificationsEnabled: boolean;
}

export const READING_CONFIG: Record<
  ReadingType,
  {
    label: string;
    icon: string;
    defaultUnit: string;
    normalRange: { min: number; max: number };
    warningRange: { min: number; max: number };
  }
> = {
  glucose: {
    label: "Glucose",
    icon: "droplet",
    defaultUnit: "mg/dL",
    normalRange: { min: 70, max: 100 },
    warningRange: { min: 60, max: 140 },
  },
  hemoglobin: {
    label: "Hemoglobin",
    icon: "heart",
    defaultUnit: "g/dL",
    normalRange: { min: 12, max: 17 },
    warningRange: { min: 10, max: 19 },
  },
  cholesterol: {
    label: "Cholesterol",
    icon: "activity",
    defaultUnit: "mg/dL",
    normalRange: { min: 0, max: 200 },
    warningRange: { min: 0, max: 240 },
  },
  platelets: {
    label: "Platelets",
    icon: "trending-up",
    defaultUnit: "K/uL",
    normalRange: { min: 150, max: 400 },
    warningRange: { min: 100, max: 450 },
  },
};

export function getReadingStatus(type: ReadingType, value: number): ReadingStatus {
  const config = READING_CONFIG[type];
  if (value >= config.normalRange.min && value <= config.normalRange.max) {
    return "normal";
  }
  if (value >= config.warningRange.min && value <= config.warningRange.max) {
    return "warning";
  }
  return "critical";
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  displayName: "User",
  avatarIndex: 0,
  units: "mg/dL",
  darkMode: "system",
  notificationsEnabled: false,
};
