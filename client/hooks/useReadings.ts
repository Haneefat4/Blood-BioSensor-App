import { useState, useEffect, useCallback } from "react";
import type { Reading, ReadingType, ReadingTag, ReferenceSex } from "@/types";
import { getReadings, saveReading, deleteReading } from "@/lib/storage";
import { latestReading, sortReadingsByTimestampDesc } from "@/lib/readingOrder";
import { assessReading } from "@/lib/referenceRanges";
import { READING_CONFIG } from "@/types";

export interface AddReadingOptions {
  notes?: string;
  isFasting?: boolean;
  tags?: ReadingTag[];
  photoUri?: string;
  /** Hemoglobin band at save time. Screens still recompute on display. */
  referenceSex?: ReferenceSex;
  /** When the sample was taken. Defaults to the moment it is saved. */
  timestamp?: number;
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
      const timestamp =
        options?.timestamp != null && Number.isFinite(options.timestamp)
          ? options.timestamp
          : Date.now();
      const newReading: Reading = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        value,
        unit: config.defaultUnit,
        timestamp,
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
      setReadings((prev) =>
        sortReadingsByTimestampDesc([
          newReading,
          ...prev.filter((item) => item.id !== newReading.id),
        ]),
      );
      return newReading;
    },
    [],
  );

  const updateReading = useCallback(
    async (
      id: string,
      type: ReadingType,
      value: number,
      options?: AddReadingOptions,
    ) => {
      const config = READING_CONFIG[type];
      const timestamp =
        options?.timestamp != null && Number.isFinite(options.timestamp)
          ? options.timestamp
          : Date.now();
      const updated: Reading = {
        id,
        type,
        value,
        unit: config.defaultUnit,
        timestamp,
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
      await saveReading(updated);
      setReadings((prev) =>
        sortReadingsByTimestampDesc([
          updated,
          ...prev.filter((item) => item.id !== updated.id),
        ]),
      );
      return updated;
    },
    [],
  );

  const removeReading = useCallback(async (id: string) => {
    await deleteReading(id);
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getLatestByType = useCallback(
    (type: ReadingType): Reading | undefined => {
      return latestReading(readings, (reading) => reading.type === type);
    },
    [readings],
  );

  const getLatestReading = useCallback((): Reading | undefined => {
    return latestReading(readings);
  }, [readings]);

  const refresh = useCallback(async () => {
    return loadReadings();
  }, [loadReadings]);

  return {
    readings,
    isLoading,
    addReading,
    updateReading,
    removeReading,
    getLatestByType,
    getLatestReading,
    refresh,
  };
}
