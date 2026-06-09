import { useEffect, useState } from 'react';
import { storageGet, storageGetAllKeys } from '@/lib/storage';
import { ALL_ITEM_IDS, CHECKLIST_SECTIONS } from '@/constants/checklist-data';
import { getLast30Days, getLast7Days } from '@/lib/date-utils';

type DayData = {
  date: string;
  completedCount: number;
  totalCount: number;
  pct: number;
};

type ChecklistState = {
  completed: Record<string, boolean>;
  date: string;
};

export function useAnalytics() {
  const [last30, setLast30] = useState<DayData[]>([]);
  const [last7, setLast7] = useState<DayData[]>([]);
  const [perHabitRates, setPerHabitRates] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadAnalytics().then(setLoaded.bind(null, true));
  }, []);

  async function loadAnalytics() {
    const days30 = getLast30Days();
    const days7 = getLast7Days();
    const total = ALL_ITEM_IDS.length;

    const dayDataMap: Record<string, DayData> = {};
    const habitCounts: Record<string, number> = {};
    const habitDays: Record<string, number> = {};

    for (const date of days30) {
      const key = '@checklist/state_' + date;
      const saved = await storageGet<ChecklistState>(key);
      const completed = saved?.completed ?? {};
      const count = ALL_ITEM_IDS.filter((id) => completed[id]).length;
      dayDataMap[date] = { date, completedCount: count, totalCount: total, pct: count / total };

      for (const id of ALL_ITEM_IDS) {
        habitDays[id] = (habitDays[id] ?? 0) + 1;
        if (completed[id]) habitCounts[id] = (habitCounts[id] ?? 0) + 1;
      }
    }

    const rates: Record<string, number> = {};
    for (const id of ALL_ITEM_IDS) {
      rates[id] = habitDays[id] ? (habitCounts[id] ?? 0) / habitDays[id] : 0;
    }

    setLast30(days30.map((d) => dayDataMap[d] ?? { date: d, completedCount: 0, totalCount: total, pct: 0 }));
    setLast7(days7.map((d) => dayDataMap[d] ?? { date: d, completedCount: 0, totalCount: total, pct: 0 }));
    setPerHabitRates(rates);
  }

  const weeklyAvgPct =
    last7.length > 0 ? last7.reduce((a, d) => a + d.pct, 0) / last7.length : 0;
  const monthlyAvgPct =
    last30.length > 0 ? last30.reduce((a, d) => a + d.pct, 0) / last30.length : 0;
  const perfectDays = last30.filter((d) => d.pct === 1).length;

  return {
    last30,
    last7,
    perHabitRates,
    weeklyAvgPct,
    monthlyAvgPct,
    perfectDays,
    loaded,
    reload: loadAnalytics,
  };
}
