import { BD_FOODS } from '@/lib/bd-foods';

export type Meal = { label: string; items: string; kcal: number };
export type DayPlan = { day: string; meals: Meal[]; total: number };
export type MealPlan = { generatedOn: string; days: DayPlan[]; source: 'ai' | 'rules' };

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function food(name: string): number {
  return BD_FOODS.find((f) => f.name.toLowerCase().includes(name.toLowerCase()))?.cal ?? 100;
}

/**
 * Rule-based 7-day Bangladesh plan within the calorie target. Used when there's no
 * API key, or as a fallback when the AI call fails. Rotates the protein so fish days
 * (the user's best days) land mid-week.
 */
export function buildRuleMealPlan(calorieTarget: number): MealPlan {
  const proteins = ['Rui fish curry', 'Chicken curry', 'Egg bhaji', 'Hilsa fish curry', 'Dal', 'Chicken curry', 'Rui fish curry'];
  const days: DayPlan[] = DAYS.map((day, i) => {
    const breakfast: Meal = { label: 'Breakfast', items: '2 boiled eggs + 1 ruti, rong cha (no sugar)', kcal: food('Egg') * 2 + food('Bread') };
    const protein = proteins[i % proteins.length];
    const lunch: Meal = { label: 'Lunch', items: `1 cup bhat + ${protein} + salad`, kcal: food('Bhat') + food(protein) + 30 };
    const snack: Meal = { label: 'Snack', items: i % 2 === 0 ? 'Banana + muri' : 'Boiled chola, rong cha', kcal: food('Banana') + food('Muri') };
    const dinner: Meal = { label: 'Dinner', items: '½ cup bhat + sabji + dal, then a 20-min walk', kcal: Math.round(food('Bhat') / 2) + food('Sabji') + food('Dal') };
    const meals = [breakfast, lunch, snack, dinner];
    const total = meals.reduce((s, m) => s + m.kcal, 0);
    return { day, meals, total };
  });
  return { generatedOn: new Date().toISOString().split('T')[0], days, source: 'rules' };
}

/** Prompt for the LLM to produce a structured JSON plan we can parse. */
export function buildMealPlanPrompt(calorieTarget: number): string {
  const foodList = BD_FOODS.map((f) => `${f.name} (${f.cal})`).join(', ');
  return `Create a 7-day Bangladeshi weight-loss meal plan. Daily target ~${calorieTarget} kcal.
Use common, affordable Bangladeshi foods. Prefer fish/chicken over red meat, 1 cup rice max at lunch,
lighter dinners, no sugary drinks (no Nescafe 3-in-1). Reference calories: ${foodList}.
Return ONLY valid JSON, no markdown, in exactly this shape:
{"days":[{"day":"Sat","meals":[{"label":"Breakfast","items":"...","kcal":300},{"label":"Lunch","items":"...","kcal":450},{"label":"Snack","items":"...","kcal":150},{"label":"Dinner","items":"...","kcal":400}]}]}
Include all 7 days: Sat, Sun, Mon, Tue, Wed, Thu, Fri.`;
}

/** Parse the LLM JSON response into a MealPlan, or null if unparseable. */
export function parseMealPlan(raw: string): MealPlan | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as { days?: { day: string; meals: Meal[] }[] };
    if (!parsed.days?.length) return null;
    const days: DayPlan[] = parsed.days.map((d) => ({
      day: d.day,
      meals: d.meals ?? [],
      total: (d.meals ?? []).reduce((s, m) => s + (Number(m.kcal) || 0), 0),
    }));
    return { generatedOn: new Date().toISOString().split('T')[0], days, source: 'ai' };
  } catch {
    return null;
  }
}
