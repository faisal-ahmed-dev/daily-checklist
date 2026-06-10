// Rule-based daily brief generation, extracted from use-ai-coach.ts so it can
// be reused for scheduling the "daily brief" notification without an API call.

export type CoachContext = {
  userName: string;
  currentWeight: number | null;
  goalWeight: number;
  startWeight: number;
  streak: number;
  doneCount: number;
  totalCount: number;
  stepsToday: number;
  stepGoal: number;
  waterGlasses: number;
  sleepHours: number | null;
  weeklyCompletionPcts: number[];
  weakHabits: string[];
  strongHabits: string[];
  // Extended context
  caloriesConsumed?: number;
  calorieTarget?: number;
  customContextFields?: string; // pre-formatted string from getFieldsForPrompt()
};

/** Rule-based daily brief (no API needed). Returns a short multi-line summary. */
export function generateDailyBrief(ctx: CoachContext): string {
  const lines: string[] = [];
  const pct = ctx.totalCount > 0 ? (ctx.doneCount / ctx.totalCount) * 100 : 0;

  if (ctx.streak >= 7) lines.push(`🔥 ${ctx.streak}-day streak — you're building real momentum!`);
  else if (ctx.streak >= 3) lines.push(`🔥 ${ctx.streak} days consistent — keep it going!`);
  else if (ctx.streak === 1) lines.push('Great start today — every streak begins with day 1.');
  else lines.push('Fresh start today. Every day is a new chance.');

  if (pct >= 80) lines.push(`Today's checklist: ${ctx.doneCount}/${ctx.totalCount} done. Excellent day!`);
  else if (pct >= 50) lines.push(`${ctx.doneCount}/${ctx.totalCount} items done. A few more to close out the day strong.`);
  else if (ctx.doneCount > 0) lines.push(`${ctx.doneCount}/${ctx.totalCount} done so far. Keep checking items off.`);

  if (ctx.weakHabits.length > 0) {
    lines.push(`📍 Focus area: ${ctx.weakHabits[0]} — this is your most skipped habit.`);
  }

  if (ctx.stepsToday < ctx.stepGoal * 0.5 && new Date().getHours() > 15) {
    lines.push(`👟 Only ${ctx.stepsToday.toLocaleString()} steps so far. A short walk now would help.`);
  }

  if (ctx.waterGlasses < 4 && new Date().getHours() >= 12) {
    lines.push(`💧 Only ${ctx.waterGlasses} glasses of water. Drink 2 more before dinner.`);
  }

  if (ctx.currentWeight && ctx.currentWeight > ctx.goalWeight) {
    const remaining = (ctx.currentWeight - ctx.goalWeight).toFixed(1);
    lines.push(`⚖️ ${remaining} kg to your goal. Every day of consistency gets you closer.`);
  }

  return lines.join('\n');
}

export type AiBriefConfig = { apiKey: string; baseUrl: string; model: string };

/**
 * Ask the configured LLM for a single short, personalized notification line.
 * Throws on any failure so callers can fall back to {@link generateDailyBrief}.
 */
export async function fetchAiBrief(config: AiBriefConfig, ctx: CoachContext): Promise<string> {
  const status = generateDailyBrief(ctx);
  const prompt = `User's current status:
${status}

Write ONE short push notification (max 220 chars) telling ${ctx.userName || 'them'} how today is going and the single most useful next action. Warm, specific, no greeting, no markdown.`;

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are a concise, encouraging weight-loss coach writing a single phone notification.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 120,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`AI brief failed: ${res.status}`);
  const data = await res.json();
  const content: string | undefined = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('AI brief empty');
  return content;
}
