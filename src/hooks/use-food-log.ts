import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';

export type FoodEntry = {
  id: string;
  name: string;
  calories: number;
  time: string; // HH:MM
};

const LOG_KEY = (date: string) => `@food/log_${date}`;

export function useFoodLog() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storageGet<FoodEntry[]>(LOG_KEY(todayKey())).then((saved) => {
      setEntries(saved ?? []);
      setLoaded(true);
    });
  }, []);

  const addEntry = useCallback((name: string, calories: number) => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const entry: FoodEntry = {
      id: `food_${Date.now()}`,
      name: name.trim(),
      calories,
      time,
    };
    setEntries((prev) => {
      const next = [...prev, entry];
      storageSet(LOG_KEY(todayKey()), next);
      return next;
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      storageSet(LOG_KEY(todayKey()), next);
      return next;
    });
  }, []);

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);

  async function getLastNDays(n: number): Promise<{ date: string; total: number }[]> {
    const result: { date: string; total: number }[] = [];
    const today = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayEntries = await storageGet<FoodEntry[]>(LOG_KEY(key));
      const total = (dayEntries ?? []).reduce((sum, e) => sum + e.calories, 0);
      result.push({ date: key, total });
    }
    return result;
  }

  return {
    entries,
    addEntry,
    deleteEntry,
    totalCalories,
    loaded,
    getLastNDays,
  };
}
