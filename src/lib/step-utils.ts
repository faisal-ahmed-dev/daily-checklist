// Shared step-tracking helpers used by both the foreground pedometer hook
// (use-pedometer.ts) and the background fetch task (background-tasks.ts).

export const STEP_MILESTONE_CHANNEL = 'step-milestones';
export const STEP_INACTIVITY_CHANNEL = 'inactivity-alert';

// Rough energy estimate: ~0.04 kcal per step for an average adult.
export function estimateStepCalories(steps: number): number {
  return Math.round(steps * 0.04);
}

export function getMilestoneMessage(
  milestone: number,
  goalSteps: number
): { title: string; body: string } {
  if (milestone * 1000 >= goalSteps) {
    return {
      title: `🎉 Goal reached! ${(milestone * 1000).toLocaleString()} steps`,
      body: 'You hit your step goal! Take a moment to stretch and celebrate.',
    };
  }
  const messages: Record<number, string> = {
    1: 'Every journey starts here. Keep walking!',
    2: '2,000 steps — great start to the day!',
    3: "3,000 steps! You're warming up nicely.",
    4: '4,000 steps — almost halfway there!',
    5: '5,000 steps! Halfway to your goal 💪',
    6: "6,000 steps — you're in the zone now.",
    7: '7,000 steps! Just 3,000 more to go.',
    8: '8,000 steps — excellent effort today!',
    9: '9,000 steps! One more push to the goal.',
  };
  return {
    title: `👟 ${(milestone * 1000).toLocaleString()} steps!`,
    body: messages[milestone] ?? `${(milestone * 1000).toLocaleString()} steps — keep going!`,
  };
}
