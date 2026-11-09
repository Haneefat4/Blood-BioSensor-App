import { useState, useEffect, useCallback } from "react";
import type { Reading, ReadingType, ReadingTag, ReferenceSex } from "@/types";
import { getReadings, saveReading, deleteReading } from "@/lib/storage";
import { assessReading } from "@/lib/referenceRanges";
import { READING_CONFIG } from "@/types";

export interface AddReadingOptions {
  notes?: string;
  isFasting?: boolean;
  tags?: ReadingTag[];
  photoUri?: string;
  /** Hemoglobin band at save time. Screens still recompute on display. */
  referenceSex?: ReferenceSex;
}

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
    async (type: ReadingType, value: number, options?: AddReadingOptions) => {
      const config = READING_CONFIG[type];
      // Callers pass the canonical unit. The stored severity is a snapshot;
      // every screen recomputes from referenceRanges when it renders.
      const newReading: Reading = {
        id: Date.now().toString(),
        type,
        value,
        unit: config.defaultUnit,
        timestamp: Date.now(),
        notes: options?.notes,
        status: assessReading({
          type,
          canonicalValue: value,
          isFasting: options?.isFasting,
          sex: options?.referenceSex,
        }).severity,
        isFasting: options?.isFasting,
        tags: options?.tags,
        photoUri: options?.photoUri,
      };
      await saveReading(newReading);
      setReadings((prev) => [newReading, ...prev]);
      return newReading;
    },
    [],
  );

  const removeReading = useCallback(async (id: string) => {
    await deleteReading(id);
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getLatestByType = useCallback(
    (type: ReadingType): Reading | undefined => {
      return readings.find((r) => r.type === type);
    },
    [readings],
  );

  const getLatestReading = useCallback((): Reading | undefined => {
    return readings[0];
  }, [readings]);

  const refresh = useCallback(async () => {
    return loadReadings();
  }, [loadReadings]);

  return {
    readings,
    isLoading,
    addReading,
    removeReading,
    getLatestByType,
    getLatestReading,
    refresh,
  };
}
