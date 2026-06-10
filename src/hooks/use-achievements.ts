import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet, storageGetAllKeys } from '@/lib/storage';
import {
  ACHIEVEMENTS,
  earnedIds,
  totalXp,
  levelFromXp,
  type Achievement,
  type AchievementStats,
} from '@/lib/achievements';

const UNLOCKED_KEY = '@achievements/unlocked';
const ONPACE_KEY = '@achievements/onpace_days';
const ONPACE_TICK_KEY = '@achievements/onpace_last';

/** Scan history keys to assemble lifetime stats for achievement evaluation. */
async function gatherStats(kgLost: number, streak: number, onPace: boolean): Promise<AchievementStats> {
  const keys = await storageGetAllKeys();

  let workoutsDone = 0;
  for (const k of keys.filter((x) => x.startsWith('@workout/done_'))) {
    const arr = await storageGet<string[]>(k);
    workoutsDone += arr?.length ?? 0;
  }

  let waterGoalDays = 0;
  for (const k of keys.filter((x) => x.startsWith('@water/glasses_'))) {
    const n = await storageGet<number>(k);
    if ((n ?? 0) >= 8) waterGoalDays += 1;
  }

  // No-Nescafe day = a day the user was active (logged water) but Nescafe count is 0/absent.
  let noNescafeDays = 0;
  for (const k of keys.filter((x) => x.startsWith('@water/glasses_'))) {
    const date = k.replace('@water/glasses_', '');
    const nes = await storageGet<number>(`@nescafe/count_${date}`);
    if ((nes ?? 0) === 0) noNescafeDays += 1;
  }

  const photos = await storageGet<unknown[]>('@photos/entries');

  // On-pace day counter: tick once per calendar day while on pace.
  let onPaceDays = (await storageGet<number>(ONPACE_KEY)) ?? 0;
  const today = new Date().toISOString().split('T')[0];
  const lastTick = await storageGet<string>(ONPACE_TICK_KEY);
  if (onPace && lastTick !== today) {
    onPaceDays += 1;
    await storageSet(ONPACE_KEY, onPaceDays);
    await storageSet(ONPACE_TICK_KEY, today);
  }

  return {
    kgLost,
    streak,
    onPaceDays,
    workoutsDone,
    noNescafeDays,
    waterGoalDays,
    photosCount: photos?.length ?? 0,
  };
}

export function useAchievements(args: { kgLost: number; streak: number; onPace: boolean }) {
  const { kgLost, streak, onPace } = args;
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [newly, setNewly] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);

  const refresh = useCallback(async () => {
    const s = await gatherStats(kgLost, streak, onPace);
    setStats(s);
    const nowEarned = earnedIds(s);
    const prev = (await storageGet<string[]>(UNLOCKED_KEY)) ?? [];
    const fresh = nowEarned.filter((id) => !prev.includes(id));
    if (fresh.length) {
      await storageSet(UNLOCKED_KEY, nowEarned);
      setNewly(ACHIEVEMENTS.filter((a) => fresh.includes(a.id)));
    }
    setUnlocked(nowEarned);
  }, [kgLost, streak, onPace]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const xp = totalXp(unlocked);
  const level = levelFromXp(xp);
  const clearNewly = useCallback(() => setNewly([]), []);

  return { unlocked, newly, stats, xp, level, refresh, clearNewly, all: ACHIEVEMENTS };
}
