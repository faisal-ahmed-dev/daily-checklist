import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { calcBMI, predictGoalDate } from '@/lib/bmr-calculator';
import { todayKey } from '@/lib/date-utils';

export type WeightEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  kg: number;
  note?: string;
};

const ENTRIES_KEY = '@weight/entries';
const HEIGHT_KEY = '@weight/height_cm';
const START_WEIGHT = 89;
const GOAL_WEIGHT = 70;

export function useWeightLog() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [heightCm, setHeightCm] = useState<number>(170);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      storageGet<WeightEntry[]>(ENTRIES_KEY),
      storageGet<number>(HEIGHT_KEY),
    ]).then(([saved, h]) => {
      if (saved) setEntries(saved);
      if (h) setHeightCm(h);
      setLoaded(true);
    });
  }, []);

  const addEntry = useCallback(
    async (kg: number, date: string = todayKey(), note?: string) => {
      const entry: WeightEntry = {
        id: Date.now().toString(),
        date,
        kg,
        note,
      };
      setEntries((prev) => {
        const next = [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date));
        storageSet(ENTRIES_KEY, next);
        return next;
      });
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      storageSet(ENTRIES_KEY, next);
      return next;
    });
  }, []);

  const updateHeight = useCallback((cm: number) => {
    setHeightCm(cm);
    storageSet(HEIGHT_KEY, cm);
  }, []);

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sorted[0]?.kg ?? null;
  const bmi = latestWeight ? calcBMI(latestWeight, heightCm) : null;
  const kgLost = latestWeight ? Math.max(0, START_WEIGHT - latestWeight) : 0;
  const kgToGo = latestWeight ? Math.max(0, latestWeight - GOAL_WEIGHT) : START_WEIGHT - GOAL_WEIGHT;
  const progressPct =
    latestWeight && latestWeight < START_WEIGHT
      ? Math.min(1, (START_WEIGHT - latestWeight) / (START_WEIGHT - GOAL_WEIGHT))
      : 0;

  const goalDate = predictGoalDate(
    sorted.map((e) => ({ date: e.date, kg: e.kg })),
    GOAL_WEIGHT
  );

  // Weekly weight change
  const weeklyChange = (() => {
    if (sorted.length < 2) return null;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDayKey = sevenDaysAgo.toISOString().split('T')[0];
    const weekOldEntry = sorted.find((e) => e.date <= sevenDayKey);
    if (!weekOldEntry || !latestWeight) return null;
    return +(latestWeight - weekOldEntry.kg).toFixed(1);
  })();

  return {
    entries: sorted,
    addEntry,
    deleteEntry,
    heightCm,
    updateHeight,
    latestWeight,
    bmi,
    kgLost,
    kgToGo,
    progressPct,
    goalDate,
    weeklyChange,
    loaded,
    startWeight: START_WEIGHT,
    goalWeight: GOAL_WEIGHT,
  };
}
