import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';

const PREFIX = '@water/glasses_';
const GOAL = 8;

export function useWater() {
  const [glasses, setGlasses] = useState(0);

  useEffect(() => {
    storageGet<number>(PREFIX + todayKey()).then((saved) => {
      if (saved !== null) setGlasses(saved);
    });
  }, []);

  const addGlass = useCallback(() => {
    setGlasses((prev) => {
      const next = Math.min(prev + 1, GOAL);
      storageSet(PREFIX + todayKey(), next);
      return next;
    });
  }, []);

  const removeGlass = useCallback(() => {
    setGlasses((prev) => {
      const next = Math.max(prev - 1, 0);
      storageSet(PREFIX + todayKey(), next);
      return next;
    });
  }, []);

  const setGlassesTo = useCallback((count: number) => {
    const next = Math.min(Math.max(0, count), 20);
    setGlasses(next);
    storageSet(PREFIX + todayKey(), next);
  }, []);

  const mlDrunk = glasses * 250;
  const mlGoal = GOAL * 250;
  const done = glasses >= GOAL;

  return { glasses, addGlass, removeGlass, setGlassesTo, mlDrunk, mlGoal, goal: GOAL, done };
}
