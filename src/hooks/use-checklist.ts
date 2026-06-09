import { useCallback, useEffect, useState } from 'react';
import { ALL_ITEM_IDS } from '@/constants/checklist-data';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';

type ChecklistState = {
  completed: Record<string, boolean>;
  date: string;
};

const PREFIX = '@checklist/state_';

export function useChecklist() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const key = PREFIX + todayKey();
    storageGet<ChecklistState>(key).then((saved) => {
      if (saved && saved.date === todayKey()) {
        setCompleted(saved.completed ?? {});
      }
      setLoaded(true);
    });
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setCompleted((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        const key = PREFIX + todayKey();
        storageSet(key, { completed: next, date: todayKey() });
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    setCompleted({});
    const key = PREFIX + todayKey();
    storageSet(key, { completed: {}, date: todayKey() });
  }, []);

  const doneCount = ALL_ITEM_IDS.filter((id) => completed[id]).length;
  const totalCount = ALL_ITEM_IDS.length;
  const allDone = doneCount === totalCount && totalCount > 0;
  const progressPct = totalCount > 0 ? doneCount / totalCount : 0;

  return {
    completed,
    toggle,
    reset,
    doneCount,
    totalCount,
    allDone,
    progressPct,
    loaded,
  };
}
