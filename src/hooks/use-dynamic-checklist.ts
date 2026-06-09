import { useCallback, useEffect, useState } from 'react';
import { CHECKLIST_SECTIONS, ChecklistItem, ChecklistSection } from '@/constants/checklist-data';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';

export type DynamicItem = ChecklistItem & {
  isBuiltIn: boolean;
  sectionKey: string;
  hidden?: boolean;
  order?: number;
};

export type DynamicSection = Omit<ChecklistSection, 'items'> & {
  isBuiltIn: boolean;
  items: DynamicItem[];
};

type CompletedState = { completed: Record<string, boolean>; date: string };

const KEYS = {
  custom: '@checklist/custom_items',
  hidden: '@checklist/hidden_builtins',
  customSections: '@checklist/custom_sections',
  completed: (date: string) => `@checklist/state_${date}`,
};

export function useDynamicChecklist() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [customItems, setCustomItems] = useState<DynamicItem[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [customSections, setCustomSections] = useState<DynamicSection[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      storageGet<CompletedState>(KEYS.completed(todayKey())),
      storageGet<DynamicItem[]>(KEYS.custom),
      storageGet<string[]>(KEYS.hidden),
      storageGet<DynamicSection[]>(KEYS.customSections),
    ]).then(([saved, custom, hidden, sections]) => {
      if (saved?.date === todayKey()) setCompleted(saved.completed ?? {});
      setCustomItems(custom ?? []);
      setHiddenIds(hidden ?? []);
      setCustomSections(sections ?? []);
      setLoaded(true);
    });
  }, []);

  // Build merged sections (built-in + custom)
  const sections: DynamicSection[] = [
    ...CHECKLIST_SECTIONS.map((s) => ({
      ...s,
      isBuiltIn: true,
      items: [
        ...s.items
          .filter((item) => !hiddenIds.includes(item.id))
          .map((item) => ({ ...item, isBuiltIn: true, sectionKey: s.key })),
        ...customItems.filter((ci) => ci.sectionKey === s.key && !ci.hidden),
      ],
    })),
    ...customSections.map((cs) => ({
      ...cs,
      items: customItems.filter((ci) => ci.sectionKey === cs.key && !ci.hidden),
    })),
  ];

  const allItemIds = sections.flatMap((s) => s.items.map((i) => i.id));
  const doneCount = allItemIds.filter((id) => completed[id]).length;
  const totalCount = allItemIds.length;
  const allDone = doneCount === totalCount && totalCount > 0;
  const progressPct = totalCount > 0 ? doneCount / totalCount : 0;

  const saveCompleted = useCallback((next: Record<string, boolean>) => {
    storageSet(KEYS.completed(todayKey()), { completed: next, date: todayKey() });
  }, []);

  const toggle = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveCompleted(next);
      return next;
    });
  }, [saveCompleted]);

  const reset = useCallback(() => {
    setCompleted({});
    saveCompleted({});
  }, [saveCompleted]);

  const addItem = useCallback(
    async (sectionKey: string, main: string, sub: string = '', avoid: boolean = false) => {
      const newItem: DynamicItem = {
        id: `custom_${Date.now()}`,
        main,
        sub,
        avoid,
        isBuiltIn: false,
        sectionKey,
      };
      setCustomItems((prev) => {
        const next = [...prev, newItem];
        storageSet(KEYS.custom, next);
        return next;
      });
    },
    []
  );

  const editItem = useCallback(
    async (id: string, updates: Partial<Pick<DynamicItem, 'main' | 'sub' | 'avoid'>>) => {
      setCustomItems((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
        storageSet(KEYS.custom, next);
        return next;
      });
    },
    []
  );

  const deleteItem = useCallback(
    async (id: string, isBuiltIn: boolean) => {
      if (isBuiltIn) {
        setHiddenIds((prev) => {
          const next = [...prev, id];
          storageSet(KEYS.hidden, next);
          return next;
        });
      } else {
        setCustomItems((prev) => {
          const next = prev.filter((item) => item.id !== id);
          storageSet(KEYS.custom, next);
          return next;
        });
      }
    },
    []
  );

  const restoreItem = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = prev.filter((hid) => hid !== id);
      storageSet(KEYS.hidden, next);
      return next;
    });
  }, []);

  const moveItemUp = useCallback(
    (id: string) => {
      setCustomItems((prev) => {
        const idx = prev.findIndex((i) => i.id === id);
        if (idx <= 0) return prev;
        const next = [...prev];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        storageSet(KEYS.custom, next);
        return next;
      });
    },
    []
  );

  const moveItemDown = useCallback(
    (id: string) => {
      setCustomItems((prev) => {
        const idx = prev.findIndex((i) => i.id === id);
        if (idx < 0 || idx >= prev.length - 1) return prev;
        const next = [...prev];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        storageSet(KEYS.custom, next);
        return next;
      });
    },
    []
  );

  const addSection = useCallback((title: string, time: string = 'custom') => {
    const newSection: DynamicSection = {
      key: `custom_section_${Date.now()}`,
      title,
      time,
      start: -1,
      end: -1,
      isBuiltIn: false,
      items: [],
    };
    setCustomSections((prev) => {
      const next = [...prev, newSection];
      storageSet(KEYS.customSections, next);
      return next;
    });
  }, []);

  const renameSection = useCallback((key: string, newTitle: string) => {
    setCustomSections((prev) => {
      const next = prev.map((s) => (s.key === key ? { ...s, title: newTitle } : s));
      storageSet(KEYS.customSections, next);
      return next;
    });
  }, []);

  const deleteSection = useCallback((key: string) => {
    setCustomSections((prev) => {
      const next = prev.filter((s) => s.key !== key);
      storageSet(KEYS.customSections, next);
      return next;
    });
    setCustomItems((prev) => {
      const next = prev.filter((item) => item.sectionKey !== key);
      storageSet(KEYS.custom, next);
      return next;
    });
  }, []);

  return {
    sections,
    completed,
    toggle,
    reset,
    addItem,
    editItem,
    deleteItem,
    restoreItem,
    moveItemUp,
    moveItemDown,
    addSection,
    renameSection,
    deleteSection,
    doneCount,
    totalCount,
    allDone,
    progressPct,
    loaded,
  };
}
