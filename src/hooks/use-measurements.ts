import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';

export type MeasurementEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  waistCm: number | null;
  hipCm: number | null;
};

const KEY = '@body/measurements';

/** Waist-to-height ratio is the best single fat-distribution metric (belly fat). */
export function waistToHeight(waistCm: number, heightCm: number): number {
  return +(waistCm / heightCm).toFixed(3);
}

export function wthrCategory(ratio: number): { label: string; color: string } {
  if (ratio < 0.5) return { label: 'Healthy', color: '#2F6B4F' };
  if (ratio < 0.6) return { label: 'Increased risk', color: '#B8722A' };
  return { label: 'High risk', color: '#A03030' };
}

export function useMeasurements() {
  const [entries, setEntries] = useState<MeasurementEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storageGet<MeasurementEntry[]>(KEY).then((saved) => {
      if (saved) setEntries(saved);
      setLoaded(true);
    });
  }, []);

  // Create or update today's entry (so logging waist then hip merges into one row).
  const upsertToday = useCallback((patch: { waistCm?: number; hipCm?: number }) => {
    setEntries((prev) => {
      const today = todayKey();
      const existing = prev.find((e) => e.date === today);
      let next: MeasurementEntry[];
      if (existing) {
        next = prev.map((e) => (e.date === today ? { ...e, ...patch } : e));
      } else {
        next = [
          { id: Date.now().toString(), date: today, waistCm: null, hipCm: null, ...patch },
          ...prev,
        ];
      }
      next.sort((a, b) => b.date.localeCompare(a.date));
      storageSet(KEY, next);
      return next;
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      storageSet(KEY, next);
      return next;
    });
  }, []);

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0] ?? null;
  const prevWithWaist = sorted.find((e, i) => i > 0 && e.waistCm != null) ?? null;
  const waistChange =
    latest?.waistCm != null && prevWithWaist?.waistCm != null
      ? +(latest.waistCm - prevWithWaist.waistCm).toFixed(1)
      : null;

  return { entries: sorted, latest, waistChange, upsertToday, deleteEntry, loaded };
}
