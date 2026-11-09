import { useCallback, useEffect, useRef, useState } from "react";

import { createSerialQueue } from "@/lib/serialQueue";
import { getUserPreferences, saveUserPreferences } from "@/lib/storage";
import type { UserPreferences } from "@/types";
import { DEFAULT_USER_PREFERENCES } from "@/types";

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_USER_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState(true);
  const preferencesRef = useRef(preferences);
  const enqueueRef = useRef(createSerialQueue());

  const loadPreferences = useCallback(() => {
    setIsLoading(true);
    return enqueueRef.current(async () => {
      try {
        const data = await getUserPreferences();
        preferencesRef.current = data;
        setPreferences(data);
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    return enqueueRef.current(async () => {
      const next = { ...preferencesRef.current, ...updates };
      preferencesRef.current = next;
      setPreferences(next);
      await saveUserPreferences(next);
    });
  }, []);

  const refresh = useCallback(() => loadPreferences(), [loadPreferences]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    refresh,
  };
}
