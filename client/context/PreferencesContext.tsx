import React, { createContext, useContext, ReactNode } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import type { UserPreferences } from "@/types";

interface PreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refresh: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const preferencesData = usePreferences();

  return (
    <PreferencesContext.Provider value={preferencesData}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferencesContext must be used within a PreferencesProvider");
  }
  return context;
}
