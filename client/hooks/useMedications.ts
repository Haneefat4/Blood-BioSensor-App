import { useState, useEffect, useCallback } from "react";
import type { Medication } from "@/types";
import {
  getMedications,
  saveMedication,
  updateMedication,
  deleteMedication,
} from "@/lib/storage";

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMedications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMedications();
      setMedications(data);
    } catch (error) {
      console.error("Error loading medications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const addMedication = useCallback(
    async (
      name: string,
      dosage: string,
      frequency: string,
      time?: string,
      notes?: string,
    ) => {
      const newMedication: Medication = {
        id: Date.now().toString(),
        name,
        dosage,
        frequency,
        time,
        notes,
        createdAt: Date.now(),
      };
      await saveMedication(newMedication);
      setMedications((prev) => [newMedication, ...prev]);
      return newMedication;
    },
    [],
  );

  const editMedication = useCallback(async (medication: Medication) => {
    await updateMedication(medication);
    setMedications((prev) =>
      prev.map((m) => (m.id === medication.id ? medication : m)),
    );
  }, []);

  const removeMedication = useCallback(async (id: string) => {
    await deleteMedication(id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    return loadMedications();
  }, [loadMedications]);

  return {
    medications,
    isLoading,
    addMedication,
    editMedication,
    removeMedication,
    refresh,
  };
}
