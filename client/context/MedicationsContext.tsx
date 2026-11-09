import React, { createContext, useContext, ReactNode } from "react";
import { useMedications } from "@/hooks/useMedications";
import type { Medication } from "@/types";

interface MedicationsContextType {
  medications: Medication[];
  isLoading: boolean;
  addMedication: (
    name: string,
    dosage: string,
    frequency: string,
    time?: string,
    notes?: string,
  ) => Promise<Medication>;
  editMedication: (medication: Medication) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const MedicationsContext = createContext<MedicationsContextType | null>(null);

export function MedicationsProvider({ children }: { children: ReactNode }) {
  const medicationsData = useMedications();

  return (
    <MedicationsContext.Provider value={medicationsData}>
      {children}
    </MedicationsContext.Provider>
  );
}

export function useMedicationsContext() {
  const context = useContext(MedicationsContext);
  if (!context) {
    throw new Error(
      "useMedicationsContext must be used within a MedicationsProvider",
    );
  }
  return context;
}
