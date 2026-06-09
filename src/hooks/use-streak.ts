import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey, addDays } from '@/lib/date-utils';

type StreakInfo = {
  lastDate: string | null;
  streak: number;
};

const STREAK_KEY = '@checklist/streak';

export function useStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    storageGet<StreakInfo>(STREAK_KEY).then((info) => {
      if (info) setStreak(info.streak ?? 0);
    });
  }, []);

  const markComplete = useCallback(async () => {
    const info = (await storageGet<StreakInfo>(STREAK_KEY)) ?? {
      lastDate: null,
      streak: 0,
    };
    const today = todayKey();
    if (info.lastDate === today) return; // already marked today

    const yesterday = addDays(today, -1);
    const newStreak = info.lastDate === yesterday ? info.streak + 1 : 1;
    const updated: StreakInfo = { lastDate: today, streak: newStreak };
    await storageSet(STREAK_KEY, updated);
    setStreak(newStreak);
  }, []);

  return { streak, markComplete };
}
