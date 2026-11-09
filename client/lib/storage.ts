import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Medication, Reading, UserPreferences } from "@/types";
import { cancelScheduledReminders } from "@/lib/reminders";
import { sortReadingsByTimestampDesc } from "@/lib/readingOrder";
import {
  inspectStoredMedications,
  inspectStoredReadings,
  parseStoredPreferences,
} from "@/lib/storageParse";

const READINGS_KEY = "@blood_biosensor_readings";
const PREFERENCES_KEY = "@blood_biosensor_preferences";
const MEDICATIONS_KEY = "@blood_biosensor_medications";
const DISCLAIMER_KEY = "@blood_biosensor_disclaimer_accepted";

const UNREADABLE_READINGS =
  "Saved readings could not be read, so they were left unchanged.";
const UNREADABLE_MEDICATIONS =
  "Saved medications could not be read, so they were left unchanged.";

export async function getReadings(): Promise<Reading[]> {
  try {
    const data = await AsyncStorage.getItem(READINGS_KEY);
    const inspected = inspectStoredReadings(data);
    if (inspected.unreadable) {
      console.error("Stored readings could not be parsed. Showing none.");
    }
    return sortReadingsByTimestampDesc(inspected.readings);
  } catch (error) {
    console.error("Error loading readings:", error);
    return [];
  }
}

async function loadReadingsForWrite(): Promise<Reading[]> {
  const data = await AsyncStorage.getItem(READINGS_KEY);
  const inspected = inspectStoredReadings(data);
  if (inspected.unreadable) {
    throw new Error(UNREADABLE_READINGS);
  }
  return sortReadingsByTimestampDesc(inspected.readings);
}

export async function saveReading(reading: Reading): Promise<void> {
  try {
    const readings = await loadReadingsForWrite();
    const next = sortReadingsByTimestampDesc([
      reading,
      ...readings.filter((item) => item.id !== reading.id),
    ]);
    await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(next));
  } catch (error) {
    console.error("Error saving reading:", error);
    throw error;
  }
}

export async function deleteReading(id: string): Promise<void> {
  try {
    const readings = await loadReadingsForWrite();
    const filtered = readings.filter((reading) => reading.id !== id);
    await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting reading:", error);
    throw error;
  }
}

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(PREFERENCES_KEY);
    return parseStoredPreferences(data);
  } catch (error) {
    console.error("Error loading preferences:", error);
    return parseStoredPreferences(null);
  }
}

export async function saveUserPreferences(
  preferences: UserPreferences,
): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Error saving preferences:", error);
    throw error;
  }
}

export async function getMedications(): Promise<Medication[]> {
  try {
    const data = await AsyncStorage.getItem(MEDICATIONS_KEY);
    const inspected = inspectStoredMedications(data);
    if (inspected.unreadable) {
      console.error("Stored medications could not be parsed. Showing none.");
    }
    return inspected.medications;
  } catch (error) {
    console.error("Error loading medications:", error);
    return [];
  }
}

async function loadMedicationsForWrite(): Promise<Medication[]> {
  const data = await AsyncStorage.getItem(MEDICATIONS_KEY);
  const inspected = inspectStoredMedications(data);
  if (inspected.unreadable) {
    throw new Error(UNREADABLE_MEDICATIONS);
  }
  return inspected.medications;
}

export async function saveMedication(medication: Medication): Promise<void> {
  try {
    const medications = await loadMedicationsForWrite();
    medications.unshift(medication);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
  } catch (error) {
    console.error("Error saving medication:", error);
    throw error;
  }
}

export async function updateMedication(medication: Medication): Promise<void> {
  try {
    const medications = await loadMedicationsForWrite();
    const index = medications.findIndex((item) => item.id === medication.id);
    if (index >= 0) {
      medications[index] = medication;
      await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
    }
  } catch (error) {
    console.error("Error updating medication:", error);
    throw error;
  }
}

export async function deleteMedication(id: string): Promise<void> {
  try {
    const medications = await loadMedicationsForWrite();
    const filtered = medications.filter((item) => item.id !== id);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting medication:", error);
    throw error;
  }
}

export async function hasAcceptedDisclaimer(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(DISCLAIMER_KEY);
    return value === "accepted";
  } catch (error) {
    console.error("Error reading disclaimer acknowledgement:", error);
    return false;
  }
}

export async function acceptDisclaimer(): Promise<void> {
  try {
    await AsyncStorage.setItem(DISCLAIMER_KEY, "accepted");
  } catch (error) {
    console.error("Error saving disclaimer acknowledgement:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await cancelScheduledReminders();
    await AsyncStorage.multiRemove([
      READINGS_KEY,
      PREFERENCES_KEY,
      MEDICATIONS_KEY,
    ]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}
