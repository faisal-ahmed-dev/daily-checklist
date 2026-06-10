/**
 * Home, no-equipment belly + glute program. Pure data + helpers (like bd-foods.ts).
 * Reps/holds ramp up over a 24-week window so the routine keeps getting harder.
 * Spot reduction is a myth — this shapes/strengthens core & glutes and fixes desk
 * posture; the calorie deficit is what actually removes the fat.
 */

export type ExerciseFocus = 'core' | 'glute' | 'full';
export type ExerciseUnit = 'reps' | 'sec' | 'reps/side';

type ExerciseDef = {
  id: string;
  name: string;
  emoji: string;
  focus: ExerciseFocus;
  unit: ExerciseUnit;
  base: number; // week-1 amount
  inc: number; // added every 2 weeks
  max: number; // cap
};

export type Exercise = {
  id: string;
  name: string;
  emoji: string;
  focus: ExerciseFocus;
  /** e.g. "×15", "30s", "12 / side" */
  target: string;
};

export type WorkoutSession = {
  slot: 'am' | 'pm';
  title: string;
  durationLabel: string;
  exercises: Exercise[];
};

const PROGRAM_WEEKS = 24;

// 5–7 min wake-up activation: light core + glute switch-on.
const AM_DEFS: ExerciseDef[] = [
  { id: 'am-glute-bridge', name: 'Glute bridge', emoji: '🍑', focus: 'glute', unit: 'reps', base: 15, inc: 3, max: 35 },
  { id: 'am-plank', name: 'Plank hold', emoji: '🪵', focus: 'core', unit: 'sec', base: 25, inc: 5, max: 75 },
  { id: 'am-bird-dog', name: 'Bird-dog', emoji: '🐦', focus: 'core', unit: 'reps/side', base: 8, inc: 2, max: 18 },
  { id: 'am-squat', name: 'Bodyweight squat', emoji: '🦵', focus: 'glute', unit: 'reps', base: 15, inc: 3, max: 35 },
];

// 10–15 min evening session: heavier glute + core work.
const PM_DEFS: ExerciseDef[] = [
  { id: 'pm-hip-thrust', name: 'Floor hip thrust', emoji: '🍑', focus: 'glute', unit: 'reps', base: 15, inc: 3, max: 40 },
  { id: 'pm-reverse-lunge', name: 'Reverse lunge', emoji: '🦵', focus: 'glute', unit: 'reps/side', base: 10, inc: 2, max: 24 },
  { id: 'pm-leg-raise', name: 'Lying leg raise', emoji: '🔻', focus: 'core', unit: 'reps', base: 12, inc: 2, max: 28 },
  { id: 'pm-dead-bug', name: 'Dead bug', emoji: '🪳', focus: 'core', unit: 'reps/side', base: 10, inc: 2, max: 22 },
  { id: 'pm-donkey-kick', name: 'Donkey kick', emoji: '🍑', focus: 'glute', unit: 'reps/side', base: 12, inc: 3, max: 30 },
  { id: 'pm-side-plank', name: 'Side plank', emoji: '📐', focus: 'core', unit: 'sec', base: 20, inc: 5, max: 60 },
];

const DAY_MS = 86400000;

/** Program week (0-based, capped) from a start date string (YYYY-MM-DD) or null. */
export function currentWeekIndex(startISO: string | null, today: Date = new Date()): number {
  if (!startISO) return 0;
  const start = new Date(startISO).getTime();
  const days = Math.floor((today.getTime() - start) / DAY_MS);
  return Math.max(0, Math.min(PROGRAM_WEEKS - 1, Math.floor(days / 7)));
}

function amountForWeek(def: ExerciseDef, week: number): number {
  return Math.min(def.max, def.base + Math.floor(week / 2) * def.inc);
}

function formatTarget(def: ExerciseDef, amount: number): string {
  if (def.unit === 'sec') return `${amount}s`;
  if (def.unit === 'reps/side') return `${amount} / side`;
  return `×${amount}`;
}

function buildSession(defs: ExerciseDef[], week: number): Exercise[] {
  return defs.map((d) => ({
    id: d.id,
    name: d.name,
    emoji: d.emoji,
    focus: d.focus,
    target: formatTarget(d, amountForWeek(d, week)),
  }));
}

export function getWorkout(week: number, slot: 'am' | 'pm'): WorkoutSession {
  if (slot === 'am') {
    return { slot, title: 'Morning activation', durationLabel: '5–7 min', exercises: buildSession(AM_DEFS, week) };
  }
  return { slot, title: 'Evening burn — belly & glutes', durationLabel: '10–15 min', exercises: buildSession(PM_DEFS, week) };
}

/** One-line summary for a notification body, e.g. "Glute bridge ×15 · Plank 25s · Squat ×15". */
export function workoutSummary(session: WorkoutSession): string {
  return session.exercises.map((e) => `${e.name} ${e.target}`).join(' · ');
}
