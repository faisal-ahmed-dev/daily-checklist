import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';

export type ContextCategory = 'lifestyle' | 'health' | 'food' | 'custom';

export type ContextField = {
  id: string;
  label: string;
  value: string;
  category: ContextCategory;
};

const CONTEXT_KEY = '@ai/context_fields';

export const CATEGORY_LABELS: Record<ContextCategory, string> = {
  lifestyle: 'Lifestyle Notes',
  health: 'Health & Injuries',
  food: 'Food Preferences',
  custom: 'Custom',
};

export const CATEGORY_PLACEHOLDERS: Record<ContextCategory, { label: string; value: string }> = {
  lifestyle: { label: 'Note', value: 'e.g. I sit at a desk 8h/day' },
  health: { label: 'Condition', value: 'e.g. Knee pain — avoid high impact' },
  food: { label: 'Preference', value: "e.g. I don't eat beef" },
  custom: { label: 'Label', value: 'Value' },
};

export function useAiContext() {
  const [fields, setFields] = useState<ContextField[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storageGet<ContextField[]>(CONTEXT_KEY).then((saved) => {
      setFields(saved ?? []);
      setLoaded(true);
    });
  }, []);

  const save = useCallback((next: ContextField[]) => {
    setFields(next);
    storageSet(CONTEXT_KEY, next);
  }, []);

  const addField = useCallback(
    (label: string, value: string, category: ContextCategory) => {
      const field: ContextField = {
        id: `ctx_${Date.now()}`,
        label,
        value,
        category,
      };
      setFields((prev) => {
        const next = [...prev, field];
        storageSet(CONTEXT_KEY, next);
        return next;
      });
    },
    []
  );

  // Seed starter context (once) so the AI coach is personalized from day one.
  // No-op if the user already has any context fields, so it never duplicates.
  const seedContext = useCallback(
    async (items: { label: string; value: string; category: ContextCategory }[]) => {
      const existing = await storageGet<ContextField[]>(CONTEXT_KEY);
      if (existing && existing.length > 0) return;
      const next: ContextField[] = items.map((it, i) => ({ id: `ctx_seed_${Date.now()}_${i}`, ...it }));
      await storageSet(CONTEXT_KEY, next);
      setFields(next);
    },
    []
  );

  const editField = useCallback(
    (id: string, updates: Partial<Pick<ContextField, 'label' | 'value'>>) => {
      setFields((prev) => {
        const next = prev.map((f) => (f.id === id ? { ...f, ...updates } : f));
        storageSet(CONTEXT_KEY, next);
        return next;
      });
    },
    []
  );

  const deleteField = useCallback((id: string) => {
    setFields((prev) => {
      const next = prev.filter((f) => f.id !== id);
      storageSet(CONTEXT_KEY, next);
      return next;
    });
  }, []);

  function getFieldsForPrompt(): string {
    if (fields.length === 0) return '';
    const grouped = (Object.keys(CATEGORY_LABELS) as ContextCategory[])
      .map((cat) => {
        const items = fields.filter((f) => f.category === cat);
        if (items.length === 0) return '';
        const lines = items.map((f) =>
          cat === 'custom' ? `${f.label}: ${f.value}` : f.value
        );
        return `${CATEGORY_LABELS[cat]}: ${lines.join(', ')}`;
      })
      .filter(Boolean);
    return grouped.join('\n');
  }

  return {
    fields,
    loaded,
    addField,
    seedContext,
    editField,
    deleteField,
    getFieldsForPrompt,
  };
}
