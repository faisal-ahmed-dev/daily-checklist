export type UserProfile = {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
};

const ACTIVITY_FACTORS: Record<UserProfile['activityLevel'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

/** Mifflin-St Jeor BMR */
export function calcBMR(profile: UserProfile): number {
  const { weightKg, heightCm, ageYears, gender } = profile;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return gender === 'male' ? base + 5 : base - 161;
}

/** TDEE = BMR × activity factor */
export function calcTDEE(profile: UserProfile): number {
  return calcBMR(profile) * ACTIVITY_FACTORS[profile.activityLevel];
}

/** Never recommend eating below this many kcal/day, regardless of pace pressure. */
export const MIN_CALORIE_TARGET = 1300;

/**
 * Daily calorie target. Base is a 500 kcal/day deficit (~0.5 kg/week); `extraDeficit`
 * (from the pace engine) tightens it further when the user is behind their deadline,
 * floored at MIN_CALORIE_TARGET for safety.
 */
export function calcCalorieTarget(profile: UserProfile, extraDeficit = 0): number {
  const target = Math.round(calcTDEE(profile) - 500 - Math.max(0, extraDeficit));
  return Math.max(MIN_CALORIE_TARGET, target);
}

/** Protein target: 2g per kg body weight */
export function calcProteinTarget(weightKg: number): number {
  return Math.round(weightKg * 2);
}

export function calcBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return +(weightKg / (heightM * heightM)).toFixed(1);
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#5B8DB8' };
  if (bmi < 25) return { label: 'Normal', color: '#2F6B4F' };
  if (bmi < 30) return { label: 'Overweight', color: '#B8722A' };
  return { label: 'Obese', color: '#A03030' };
}

/** Simple linear regression: predict date to reach goalKg */
export function predictGoalDate(
  entries: { date: string; kg: number }[],
  goalKg: number
): Date | null {
  if (entries.length < 3) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last14 = sorted.slice(-14);
  if (last14.length < 2) return null;

  const startDate = new Date(last14[0].date).getTime();
  const xs = last14.map((e) => (new Date(e.date).getTime() - startDate) / 86400000);
  const ys = last14.map((e) => e.kg);

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  if (slope >= 0) return null; // not losing weight

  const daysToGoal = (goalKg - intercept) / slope;
  const result = new Date(startDate + daysToGoal * 86400000);
  return result;
}
