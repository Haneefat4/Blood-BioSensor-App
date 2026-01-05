import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Reading, UserPreferences, Medication } from "@/types";
import { DEFAULT_USER_PREFERENCES } from "@/types";

const READINGS_KEY = "@blood_biosensor_readings";
const PREFERENCES_KEY = "@blood_biosensor_preferences";
const MEDICATIONS_KEY = "@blood_biosensor_medications";

export async function getReadings(): Promise<Reading[]> {
  try {
    const data = await AsyncStorage.getItem(READINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading readings:", error);
    return [];
  }
}

export async function saveReading(reading: Reading): Promise<void> {
  try {
    const readings = await getReadings();
    readings.unshift(reading);
    await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(readings));
  } catch (error) {
    console.error("Error saving reading:", error);
    throw error;
  }
}

export async function deleteReading(id: string): Promise<void> {
  try {
    const readings = await getReadings();
    const filtered = readings.filter((r) => r.id !== id);
    await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting reading:", error);
    throw error;
  }
}

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(PREFERENCES_KEY);
    return data ? { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(data) } : DEFAULT_USER_PREFERENCES;
  } catch (error) {
    console.error("Error loading preferences:", error);
    return DEFAULT_USER_PREFERENCES;
  }
}

export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
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
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading medications:", error);
    return [];
  }
}

export async function saveMedication(medication: Medication): Promise<void> {
  try {
    const medications = await getMedications();
    medications.unshift(medication);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
  } catch (error) {
    console.error("Error saving medication:", error);
    throw error;
  }
}

export async function updateMedication(medication: Medication): Promise<void> {
  try {
    const medications = await getMedications();
    const index = medications.findIndex((m) => m.id === medication.id);
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
    const medications = await getMedications();
    const filtered = medications.filter((m) => m.id !== id);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting medication:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([READINGS_KEY, PREFERENCES_KEY, MEDICATIONS_KEY]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}
