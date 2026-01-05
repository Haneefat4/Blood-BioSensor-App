import { useState, useEffect, useCallback } from "react";
import type { UserPreferences } from "@/types";
import { DEFAULT_USER_PREFERENCES } from "@/types";
import { getUserPreferences, saveUserPreferences } from "@/lib/storage";

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUserPreferences();
      setPreferences(data);
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      await saveUserPreferences(newPreferences);
    },
    [preferences]
  );

  const refresh = useCallback(async () => {
    return loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    refresh,
  };
}
