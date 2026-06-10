import { useState } from 'react';
import { fuzzyMatchFood } from '@/lib/bd-foods';
import type { AiConfig } from './use-ai-coach';

type ProviderPreset = { baseUrl: string; model: string };

export function useCalorieAi(
  aiConfig: AiConfig,
  providerPresets: Record<string, ProviderPreset>
) {
  const [estimating, setEstimating] = useState(false);

  async function estimate(foodName: string): Promise<number | null> {
    const trimmed = foodName.trim();
    if (!trimmed) return null;

    if (aiConfig.apiKey) {
      setEstimating(true);
      try {
        const preset = providerPresets[aiConfig.provider];
        const baseUrl = aiConfig.provider === 'custom' ? aiConfig.baseUrl : preset?.baseUrl;
        const model = aiConfig.provider === 'custom' ? aiConfig.model : preset?.model;
        if (!baseUrl || !model) throw new Error('No baseUrl/model');

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${aiConfig.apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are a nutritionist specializing in Bangladeshi cuisine. ' +
                  'Respond ONLY with a single integer representing the calorie count. No text, no units.',
              },
              {
                role: 'user',
                content: `Estimate total calories for: "${trimmed}". Bangladesh context (standard serving sizes). Reply with just the number.`,
              },
            ],
            max_tokens: 10,
            temperature: 0,
          }),
        });

        if (!response.ok) throw new Error(`API ${response.status}`);
        const json = await response.json();
        const raw: string = json.choices?.[0]?.message?.content?.trim() ?? '';
        const num = parseInt(raw.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > 0) return num;
      } catch {
        // fall through to fuzzy match
      } finally {
        setEstimating(false);
      }
    }

    // Fuzzy fallback — no API key or AI failed
    const match = fuzzyMatchFood(trimmed);
    return match ? match.cal : null;
  }

  return { estimate, estimating };
}
