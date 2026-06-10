import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { generateDailyBrief, type CoachContext } from '@/lib/ai-brief';

export type { CoachContext } from '@/lib/ai-brief';

export type AiProvider = 'grok' | 'groq' | 'custom';

export type AiConfig = {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

const PROVIDER_PRESETS: Record<AiProvider, { baseUrl: string; model: string }> = {
  grok: { baseUrl: 'https://api.x.ai/v1', model: 'grok-3-mini' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  custom: { baseUrl: '', model: '' },
};

const CONFIG_KEY = '@ai/config';
const MESSAGES_KEY = '@ai/messages';

export function useAiCoach() {
  const [config, setConfig] = useState<AiConfig>({
    provider: 'groq',
    apiKey: '',
    baseUrl: PROVIDER_PRESETS.groq.baseUrl,
    model: PROVIDER_PRESETS.groq.model,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      storageGet<AiConfig>(CONFIG_KEY),
      storageGet<ChatMessage[]>(MESSAGES_KEY),
    ]).then(([savedConfig, savedMessages]) => {
      if (savedConfig) setConfig(savedConfig);
      if (savedMessages) setMessages(savedMessages.slice(-20)); // keep last 20
    });
  }, []);

  const updateConfig = useCallback((updates: Partial<AiConfig>) => {
    setConfig((prev) => {
      let next = { ...prev, ...updates };
      // Auto-fill presets when provider changes
      if (updates.provider && updates.provider !== 'custom') {
        const preset = PROVIDER_PRESETS[updates.provider];
        next = { ...next, baseUrl: preset.baseUrl, model: preset.model };
      }
      storageSet(CONFIG_KEY, next);
      return next;
    });
  }, []);

  function buildSystemPrompt(ctx: CoachContext): string {
    const weekAvg =
      ctx.weeklyCompletionPcts.length > 0
        ? Math.round(
            (ctx.weeklyCompletionPcts.reduce((a, b) => a + b, 0) /
              ctx.weeklyCompletionPcts.length) *
              100
          )
        : 0;
    const calorieInfo = ctx.caloriesConsumed !== undefined && ctx.calorieTarget !== undefined
      ? `- Calories today: ${ctx.caloriesConsumed} consumed / ${ctx.calorieTarget} target (${ctx.calorieTarget - ctx.caloriesConsumed} kcal remaining)`
      : '';

    return `You are a personal weight loss and fitness coach for ${ctx.userName}.

User data:
- Weight: ${ctx.currentWeight ?? 'unknown'}kg (goal: ${ctx.goalWeight}kg, started: ${ctx.startWeight}kg)
- Today's checklist: ${ctx.doneCount}/${ctx.totalCount} items done
- Streak: ${ctx.streak} consecutive days
- Steps today: ${ctx.stepsToday.toLocaleString()} / ${ctx.stepGoal.toLocaleString()} goal
- Water: ${ctx.waterGlasses}/8 glasses
- Sleep: ${ctx.sleepHours ? ctx.sleepHours + ' hours' : 'not logged'}
${calorieInfo}
- This week avg completion: ${weekAvg}%
- Weak habits (skipped often): ${ctx.weakHabits.join(', ') || 'none identified yet'}
- Strong habits (consistent): ${ctx.strongHabits.join(', ') || 'building up'}
${ctx.customContextFields ? `\nPersonal context:\n${ctx.customContextFields}` : ''}

Instructions:
- Be concise (2-4 sentences max unless they ask for more)
- Be specific and personalized — use their actual data
- Be encouraging but honest
- Give actionable advice that fits their personal context (injuries, food preferences, lifestyle)
- Current time: ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  const sendMessage = useCallback(
    async (userMessage: string, ctx: CoachContext) => {
      if (!config.apiKey.trim()) {
        setError('No API key configured. Add one in Settings → AI Coach.');
        return;
      }

      const userMsg: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const next = [...prev, userMsg];
        storageSet(MESSAGES_KEY, next);
        return next;
      });

      setLoading(true);
      setError(null);

      try {
        const systemPrompt = buildSystemPrompt(ctx);
        const recentMessages = messages.slice(-8);

        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: userMessage },
            ],
            max_tokens: 300,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`API error ${response.status}: ${errBody.slice(0, 200)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? 'No response received.';

        const aiMsg: ChatMessage = {
          role: 'assistant',
          content,
          timestamp: Date.now(),
        };

        setMessages((prev) => {
          const next = [...prev, aiMsg];
          storageSet(MESSAGES_KEY, next.slice(-20));
          return next;
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [config, messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    storageSet(MESSAGES_KEY, []);
  }, []);

  return {
    config,
    updateConfig,
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    generateDailyBrief,
    hasApiKey: !!config.apiKey.trim(),
    providerPresets: PROVIDER_PRESETS,
  };
}
