import { useState, useEffect, useCallback } from "react";
import type { Reading, ReadingType } from "@/types";
import { getReadings, saveReading, deleteReading } from "@/lib/storage";
import { getReadingStatus, READING_CONFIG } from "@/types";

export function useReadings() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReadings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getReadings();
      setReadings(data);
    } catch (error) {
      console.error("Error loading readings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReadings();
  }, [loadReadings]);

  const addReading = useCallback(
    async (type: ReadingType, value: number, notes?: string) => {
      const config = READING_CONFIG[type];
      const newReading: Reading = {
        id: Date.now().toString(),
        type,
        value,
        unit: config.defaultUnit,
        timestamp: Date.now(),
        notes,
        status: getReadingStatus(type, value),
      };
      await saveReading(newReading);
      setReadings((prev) => [newReading, ...prev]);
      return newReading;
    },
    []
  );

  const removeReading = useCallback(async (id: string) => {
    await deleteReading(id);
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getLatestByType = useCallback(
    (type: ReadingType): Reading | undefined => {
      return readings.find((r) => r.type === type);
    },
    [readings]
  );

  const getLatestReading = useCallback((): Reading | undefined => {
    return readings[0];
  }, [readings]);

  return {
    readings,
    isLoading,
    addReading,
    removeReading,
    getLatestByType,
    getLatestReading,
    refresh: loadReadings,
  };
}
