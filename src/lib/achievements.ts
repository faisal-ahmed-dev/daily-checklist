export type AchievementStats = {
  kgLost: number;
  streak: number;
  onPaceDays: number;
  workoutsDone: number; // total exercises checked off across all days
  noNescafeDays: number;
  waterGoalDays: number;
  photosCount: number;
};

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  xp: number;
  earned: (s: AchievementStats) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-kg', title: 'First Kilo', desc: 'Lose your first 1 kg', emoji: '🎯', xp: 50, earned: (s) => s.kgLost >= 1 },
  { id: 'five-kg', title: '5 Down', desc: 'Lose 5 kg total', emoji: '🔥', xp: 150, earned: (s) => s.kgLost >= 5 },
  { id: 'ten-kg', title: 'Double Digits', desc: 'Lose 10 kg total', emoji: '🏅', xp: 300, earned: (s) => s.kgLost >= 10 },
  { id: 'goal', title: 'Goal Crusher', desc: 'Reach your 70 kg goal', emoji: '👑', xp: 600, earned: (s) => s.kgLost >= 19 },
  { id: 'streak-3', title: 'Warming Up', desc: '3-day streak', emoji: '✨', xp: 30, earned: (s) => s.streak >= 3 },
  { id: 'streak-7', title: 'One Week Strong', desc: '7-day streak', emoji: '⚡', xp: 80, earned: (s) => s.streak >= 7 },
  { id: 'streak-30', title: 'Unstoppable', desc: '30-day streak', emoji: '🚀', xp: 250, earned: (s) => s.streak >= 30 },
  { id: 'pace-7', title: 'On Track', desc: 'On pace for 7 days', emoji: '📈', xp: 100, earned: (s) => s.onPaceDays >= 7 },
  { id: 'workout-10', title: 'Mover', desc: 'Complete 10 exercises', emoji: '💪', xp: 60, earned: (s) => s.workoutsDone >= 10 },
  { id: 'workout-50', title: 'Glute Builder', desc: 'Complete 50 exercises', emoji: '🍑', xp: 200, earned: (s) => s.workoutsDone >= 50 },
  { id: 'no-nescafe-7', title: 'Sugar-Free Week', desc: '7 days, no Nescafe 3-in-1', emoji: '🍵', xp: 120, earned: (s) => s.noNescafeDays >= 7 },
  { id: 'water-7', title: 'Hydrated', desc: 'Hit water goal 7 days', emoji: '💧', xp: 80, earned: (s) => s.waterGoalDays >= 7 },
  { id: 'photo-first', title: 'Picture Proof', desc: 'Take your first progress photo', emoji: '📷', xp: 40, earned: (s) => s.photosCount >= 1 },
];

export function earnedIds(stats: AchievementStats): string[] {
  return ACHIEVEMENTS.filter((a) => a.earned(stats)).map((a) => a.id);
}

export function totalXp(ids: string[]): number {
  return ACHIEVEMENTS.filter((a) => ids.includes(a.id)).reduce((s, a) => s + a.xp, 0);
}

/** Level curve: each level needs 200 more XP than the last (1→0, 2→200, 3→500…). */
export function levelFromXp(xp: number): { level: number; intoLevel: number; needed: number } {
  let level = 1;
  let remaining = xp;
  let step = 200;
  while (remaining >= step) {
    remaining -= step;
    level += 1;
    step += 100;
  }
  return { level, intoLevel: remaining, needed: step };
}
