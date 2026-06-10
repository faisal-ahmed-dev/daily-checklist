import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';
import { currentWeekIndex, getWorkout, type WorkoutSession } from '@/lib/workout-program';

const START_KEY = '@workout/start';
const doneKey = (date: string) => `@workout/done_${date}`;

export function useWorkout() {
  const [startISO, setStartISO] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const today = todayKey();

  useEffect(() => {
    (async () => {
      let start = await storageGet<string>(START_KEY);
      if (!start) {
        start = today;
        await storageSet(START_KEY, start);
      }
      const done = await storageGet<string[]>(doneKey(today));
      setStartISO(start);
      setDoneIds(done ?? []);
      setLoaded(true);
    })();
  }, [today]);

  const week = currentWeekIndex(startISO);
  const am: WorkoutSession = getWorkout(week, 'am');
  const pm: WorkoutSession = getWorkout(week, 'pm');

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

  return { week, am, pm, doneIds, toggle, isDone, loaded };
}
