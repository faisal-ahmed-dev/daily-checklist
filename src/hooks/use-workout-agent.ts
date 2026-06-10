export type WorkoutNudge = { emoji: string; title: string; body: string };

/**
 * Time + completion based workout coaching (no location needed). Mirrors the food
 * agent: surfaces the one thing worth doing right now.
 */
export function workoutSuggestion(hour: number, amDone: boolean, pmDone: boolean): WorkoutNudge | null {
  if (amDone && pmDone) {
    return { emoji: '✅', title: 'Both sessions done', body: 'Strong day. A short evening walk locks in the win.' };
  }
  if (hour >= 5 && hour < 11 && !amDone) {
    return { emoji: '🌅', title: 'Morning activation pending', body: '5 minutes: glute bridges, plank, squats. Switches on your core before the desk.' };
  }
  if (hour >= 11 && hour < 18) {
    return { emoji: '🪑', title: 'Desk reset', body: 'Stand up: 15 squats + 20s wall sit + 10 glute squeezes. One minute, real difference.' };
  }
  if (hour >= 18 && hour < 23 && !pmDone) {
    return { emoji: '🍑', title: 'Evening burn ready', body: '10–15 min belly & glute session. Tap the workout card to start — this is the fat-loss shaper.' };
  }
  return null;
}

export function useWorkoutAgent(amDone: boolean, pmDone: boolean) {
  const suggestion = workoutSuggestion(new Date().getHours(), amDone, pmDone);
  return { suggestion };
}
