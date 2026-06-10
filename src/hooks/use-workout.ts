import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';
import {
  currentWeekIndex,
  getWorkout,
  exerciseById,
  getAlternate,
  focusOf,
  type WorkoutSession,
} from '@/lib/workout-program';

const START_KEY = '@workout/start';
const doneKey = (date: string) => `@workout/done_${date}`;
const swapsKey = (date: string) => `@workout/swaps_${date}`;
const energyKey = (date: string) => `@workout/energy_${date}`;

export type Energy = 'full' | 'quick';

/** Apply per-day swaps, then trim to a short session when energy is 'quick'. */
function shape(session: WorkoutSession, week: number, swaps: Record<string, string>, energy: Energy): WorkoutSession {
  let exercises = session.exercises.map((e) => {
    const altId = swaps[e.id];
    return altId ? exerciseById(altId, week) ?? e : e;
  });
  if (energy === 'quick') exercises = exercises.slice(0, 3);
  return { ...session, exercises };
}

export function useWorkout() {
  const [startISO, setStartISO] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [energy, setEnergyState] = useState<Energy>('full');
  const [loaded, setLoaded] = useState(false);
  const today = todayKey();

  useEffect(() => {
    (async () => {
      let start = await storageGet<string>(START_KEY);
      if (!start) {
        start = today;
        await storageSet(START_KEY, start);
      }
      const [done, sw, en] = await Promise.all([
        storageGet<string[]>(doneKey(today)),
        storageGet<Record<string, string>>(swapsKey(today)),
        storageGet<Energy>(energyKey(today)),
      ]);
      setStartISO(start);
      setDoneIds(done ?? []);
      setSwaps(sw ?? {});
      setEnergyState(en ?? 'full');
      setLoaded(true);
    })();
  }, [today]);

  const week = currentWeekIndex(startISO);
  const am = shape(getWorkout(week, 'am'), week, swaps, energy);
  const pm = shape(getWorkout(week, 'pm'), week, swaps, energy);

  const toggle = useCallback(
    (id: string) => {
      setDoneIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        storageSet(doneKey(today), next);
        return next;
      });
    },
    [today]
  );

  const isDone = useCallback((id: string) => doneIds.includes(id), [doneIds]);

  // Replace a disliked exercise with a same-focus alternate (persists for today).
  const swap = useCallback(
    (exerciseId: string) => {
      const focus = focusOf(exerciseId);
      if (!focus) return;
      const inUse = [...am.exercises, ...pm.exercises].map((e) => e.id);
      const alt = getAlternate(focus, week, [...inUse, exerciseId, ...Object.values(swaps)]);
      if (!alt) return;
      setSwaps((prev) => {
        const next = { ...prev, [exerciseId]: alt.id };
        storageSet(swapsKey(today), next);
        return next;
      });
    },
    [am.exercises, pm.exercises, week, swaps, today]
  );

  const setEnergy = useCallback(
    (level: Energy) => {
      setEnergyState(level);
      storageSet(energyKey(today), level);
    },
    [today]
  );

  return { week, am, pm, doneIds, toggle, isDone, swap, energy, setEnergy, loaded };
}
