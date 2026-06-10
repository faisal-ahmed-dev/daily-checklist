import type { SlotTime } from '@/lib/notification-tasks';

/**
 * The user's real daily rhythm. Captured in onboarding and editable in settings.
 * Notification slot default times are derived from this so reminders fire at the
 * user's actual breakfast / lunch / dinner / office hours instead of generic guesses.
 */
export type UserRoutine = {
  wake: SlotTime;
  officeStart: SlotTime;
  officeEnd: SlotTime;
  breakfast: SlotTime;
  lunch: SlotTime;
  dinner: SlotTime;
  sleep: SlotTime;
};

export const ROUTINE_KEY = '@user/routine';

/** Defaults mirror the owner's real Bangladesh desk-job day (office 8–5, rice dinner ~10pm). */
export const DEFAULT_ROUTINE: UserRoutine = {
  wake: { hour: 7, minute: 0 },
  officeStart: { hour: 8, minute: 0 },
  officeEnd: { hour: 17, minute: 0 },
  breakfast: { hour: 7, minute: 30 },
  lunch: { hour: 13, minute: 0 },
  dinner: { hour: 22, minute: 0 },
  sleep: { hour: 23, minute: 30 },
};

/** Editable routine fields, in display order, with labels + emoji for the UI. */
export const ROUTINE_FIELDS: { key: keyof UserRoutine; label: string; emoji: string }[] = [
  { key: 'wake', label: 'Wake up', emoji: '🌅' },
  { key: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { key: 'officeStart', label: 'Office starts', emoji: '🏢' },
  { key: 'officeEnd', label: 'Office ends', emoji: '🚪' },
  { key: 'lunch', label: 'Lunch', emoji: '🍚' },
  { key: 'dinner', label: 'Dinner', emoji: '🍛' },
  { key: 'sleep', label: 'Sleep', emoji: '😴' },
];

/** Add minutes to a time, clamped to the same day (00:00–23:59). */
export function addMinutes(t: SlotTime, delta: number): SlotTime {
  const total = Math.max(0, Math.min(23 * 60 + 59, t.hour * 60 + t.minute + delta));
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

/**
 * Map a routine to default times for the notification slots that have a real-life
 * anchor. Slots not returned here keep their hardcoded default in NOTIFICATION_SLOTS.
 * Precedence at schedule time: user manual override > this map > hardcoded default.
 */
export function routineSlotTimes(routine: UserRoutine): Record<string, SlotTime> {
  const { wake, officeStart, officeEnd, breakfast, lunch, dinner, sleep } = routine;
  return {
    // Wake-anchored morning block
    'weigh-in': wake,
    'morning-walk': wake,
    'morning-exercise': addMinutes(wake, 15),
    'morning-stretch': addMinutes(wake, 30),
    // Meals
    breakfast,
    lunch,
    dinner,
    // Office-anchored hydration / anti-Nescafe nudges
    'skip-nescafe-am': addMinutes(officeStart, 120), // ~the 10am coffee habit
    'water-am': addMinutes(officeStart, 150),
    'step-goal-nudge': addMinutes(officeStart, 420), // ~mid-afternoon
    'snack-pm': addMinutes(officeStart, 480), // ~the 4pm coffee habit
    'water-pm': addMinutes(lunch, 150),
    // Evening
    'evening-walk': addMinutes(officeEnd, 60),
    'water-eve': addMinutes(dinner, -60),
    'night-exercise': addMinutes(dinner, 30),
    // Wind-down anchored to sleep
    'kitchen-closed': addMinutes(dinner, 90),
    'log-weight-mood': addMinutes(sleep, -90),
    'daily-summary': addMinutes(sleep, -75),
    'night-stretch': addMinutes(sleep, -30),
    sleep,
  };
}
