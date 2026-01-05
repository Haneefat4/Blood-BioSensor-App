import React, { createContext, useContext, ReactNode } from "react";
import { useReadings, AddReadingOptions } from "@/hooks/useReadings";
import type { Reading, ReadingType } from "@/types";

interface ReadingsContextType {
  readings: Reading[];
  isLoading: boolean;
  addReading: (type: ReadingType, value: number, options?: AddReadingOptions) => Promise<Reading>;
  removeReading: (id: string) => Promise<void>;
  getLatestByType: (type: ReadingType) => Reading | undefined;
  getLatestReading: () => Reading | undefined;
  refresh: () => Promise<void>;
}

const ReadingsContext = createContext<ReadingsContextType | null>(null);

export function ReadingsProvider({ children }: { children: ReactNode }) {
  const readingsData = useReadings();

  return (
    <ReadingsContext.Provider value={readingsData}>
      {children}
    </ReadingsContext.Provider>
  );
}

export function useReadingsContext() {
  const context = useContext(ReadingsContext);
  if (!context) {
    throw new Error("useReadingsContext must be used within a ReadingsProvider");
  }
  return context;
}
