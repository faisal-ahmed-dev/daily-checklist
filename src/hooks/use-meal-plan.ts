import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { useAiCoach } from '@/hooks/use-ai-coach';
import {
  buildRuleMealPlan,
  buildMealPlanPrompt,
  parseMealPlan,
  type MealPlan,
} from '@/lib/meal-plan';

const CACHE_KEY = '@meal_plan/current';

export function useMealPlan(calorieTarget: number) {
  const { config, hasApiKey, providerPresets } = useAiCoach();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    storageGet<MealPlan>(CACHE_KEY).then((saved) => {
      if (saved) setPlan(saved);
    });
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // No key → deterministic rule-based plan.
      if (!hasApiKey) {
        const rule = buildRuleMealPlan(calorieTarget);
        setPlan(rule);
        await storageSet(CACHE_KEY, rule);
        return;
      }

      const preset = providerPresets[config.provider];
      const baseUrl = config.provider === 'custom' ? config.baseUrl : preset?.baseUrl;
      const model = config.provider === 'custom' ? config.model : preset?.model;

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a Bangladeshi nutritionist. Return only valid JSON, no markdown.' },
            { role: 'user', content: buildMealPlanPrompt(calorieTarget) },
          ],
          max_tokens: 1200,
          temperature: 0.5,
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      const raw: string = json.choices?.[0]?.message?.content ?? '';
      const parsed = parseMealPlan(raw);
      const result = parsed ?? buildRuleMealPlan(calorieTarget); // fall back if unparseable
      setPlan(result);
      await storageSet(CACHE_KEY, result);
    } catch {
      // Network/API failure → still give the user a usable plan.
      const rule = buildRuleMealPlan(calorieTarget);
      setPlan(rule);
      await storageSet(CACHE_KEY, rule);
      setError('Used an offline plan (AI unavailable).');
    } finally {
      setLoading(false);
    }
  }, [hasApiKey, calorieTarget, config, providerPresets]);

  return { plan, loading, error, generate };
}
