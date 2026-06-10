import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';

/** A Nescafe 3-in-1 sachet is ~90 kcal, mostly sugar + creamer. */
export const NESCAFE_KCAL = 90;

const key = (date: string) => `@nescafe/count_${date}`;

export function useNescafe() {
  const [count, setCount] = useState(0);
  const today = todayKey();

  useEffect(() => {
    storageGet<number>(key(today)).then((n) => setCount(n ?? 0));
  }, [today]);

  const add = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      storageSet(key(today), next);
      return next;
    });
  }, [today]);

  const reset = useCallback(() => {
    setCount(0);
    storageSet(key(today), 0);
  }, [today]);

  return { count, kcal: count * NESCAFE_KCAL, add, reset };
}
