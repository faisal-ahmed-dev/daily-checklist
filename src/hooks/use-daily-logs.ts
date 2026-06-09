import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';

export type MoodLevel = 'bad' | 'ok' | 'good' | 'great';

export type DailyLog = {
  date: string;
  sleepHours: number | null;
  mood: MoodLevel | null;
};

const LOG_KEY = (date: string) => `@daily_log/entry_${date}`;

export const MOOD_OPTIONS: { value: MoodLevel; emoji: string; label: string }[] = [
  { value: 'bad', emoji: '😞', label: 'Bad' },
  { value: 'ok', emoji: '😐', label: 'OK' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'great', emoji: '😄', label: 'Great' },
];

export const SLEEP_OPTIONS = [5, 6, 7, 8, 9];

export function useDailyLogs() {
  const [log, setLog] = useState<DailyLog>({ date: todayKey(), sleepHours: null, mood: null });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storageGet<DailyLog>(LOG_KEY(todayKey())).then((saved) => {
      if (saved) setLog(saved);
      setLoaded(true);
    });
  }, []);

  const updateLog = useCallback((updates: Partial<Omit<DailyLog, 'date'>>) => {
    setLog((prev) => {
      const next = { ...prev, ...updates, date: todayKey() };
      storageSet(LOG_KEY(todayKey()), next);
      return next;
    });
  }, []);

  const setSleep = useCallback((hours: number) => updateLog({ sleepHours: hours }), [updateLog]);
  const setMood = useCallback((mood: MoodLevel) => updateLog({ mood }), [updateLog]);

  async function getLastNDays(n: number): Promise<DailyLog[]> {
    const logs: DailyLog[] = [];
    const today = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const entry = await storageGet<DailyLog>(LOG_KEY(key));
      logs.push(entry ?? { date: key, sleepHours: null, mood: null });
    }
    return logs;
  }

  const sleepGoalMet = (log.sleepHours ?? 0) >= 7;
  const moodGoodOrGreat = log.mood === 'good' || log.mood === 'great';

  return {
    log,
    setSleep,
    setMood,
    sleepGoalMet,
    moodGoodOrGreat,
    loaded,
    getLastNDays,
  };
}
