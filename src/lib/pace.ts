const KCAL_PER_KG_FAT = 7700;
/** A standard 500 kcal/day deficit yields ~0.45 kg/week. */
const BASELINE_LOSS_PER_WEEK = (500 * 7) / KCAL_PER_KG_FAT;
/** Don't let the auto-tightened target push the daily deficit past this (safety). */
const MAX_EXTRA_DEFICIT = 250;

export type PaceStatus = {
  daysLeft: number;
  requiredKgPerWeek: number;
  /** Positive = losing this many kg/week. null when not enough data. */
  actualLossPerWeek: number | null;
  onPace: boolean;
  /** How far above the ideal trajectory the user is today (kg). 0 = on/ahead. */
  behindKg: number;
  /** Extra daily kcal deficit suggested to get back on pace (0–MAX_EXTRA_DEFICIT). */
  kcalAdjustment: number;
};

const DAY_MS = 86400000;

export function computePace(args: {
  startKg: number;
  goalKg: number;
  currentKg: number | null;
  startDate: Date;
  targetDate: Date;
  weeklyChange: number | null; // kg over last 7 days; negative = losing
  today?: Date;
}): PaceStatus {
  const { startKg, goalKg, startDate, targetDate, weeklyChange } = args;
  const current = args.currentKg ?? startKg;
  const today = args.today ?? new Date();

  const kgToGo = Math.max(0, current - goalKg);
  const daysLeft = Math.max(0, Math.round((targetDate.getTime() - today.getTime()) / DAY_MS));
  const weeksLeft = daysLeft / 7;
  const requiredKgPerWeek = weeksLeft > 0 ? kgToGo / weeksLeft : kgToGo;

  const actualLossPerWeek = weeklyChange != null ? Math.max(0, -weeklyChange) : null;

  // Ideal weight today along a straight line from start→goal across the whole window.
  const totalDays = Math.max(1, (targetDate.getTime() - startDate.getTime()) / DAY_MS);
  const elapsed = Math.min(totalDays, Math.max(0, (today.getTime() - startDate.getTime()) / DAY_MS));
  const idealToday = startKg + (goalKg - startKg) * (elapsed / totalDays);
  const behindKg = Math.max(0, +(current - idealToday).toFixed(1));

  const onPace =
    kgToGo === 0 ||
    (actualLossPerWeek != null && actualLossPerWeek + 0.05 >= requiredKgPerWeek);

  const extraNeeded = Math.max(0, requiredKgPerWeek - BASELINE_LOSS_PER_WEEK);
  const kcalAdjustment = Math.min(
    MAX_EXTRA_DEFICIT,
    Math.round((extraNeeded * KCAL_PER_KG_FAT) / 7 / 10) * 10
  );

  return { daysLeft, requiredKgPerWeek, actualLossPerWeek, onPace, behindKg, kcalAdjustment };
}

/** Default deadline: 6 months from the journey start. */
export function defaultTargetDate(startDate: Date): Date {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + 6);
  return d;
}
