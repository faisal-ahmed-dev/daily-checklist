export type BdFood = {
  name: string;
  cal: number;
  emoji: string;
};

export const BD_FOODS: BdFood[] = [
  { name: 'Bhat (1 cup)', cal: 206, emoji: '🍚' },
  { name: 'Rui fish curry', cal: 175, emoji: '🐟' },
  { name: 'Chicken curry', cal: 220, emoji: '🍗' },
  { name: 'Egg (boiled)', cal: 70, emoji: '🥚' },
  { name: 'Egg bhaji', cal: 95, emoji: '🍳' },
  { name: 'Dal (katori)', cal: 150, emoji: '🫕' },
  { name: 'Parota (1)', cal: 140, emoji: '🫓' },
  { name: 'Bread (1 slice)', cal: 80, emoji: '🍞' },
  { name: 'Milk cha', cal: 65, emoji: '☕' },
  { name: 'Nescafe latte', cal: 90, emoji: '☕' },
  { name: 'Sabji plate', cal: 80, emoji: '🥦' },
  { name: 'Biryani plate', cal: 520, emoji: '🍛' },
  { name: 'Luchi (2)', cal: 200, emoji: '🫓' },
  { name: 'Khichuri plate', cal: 300, emoji: '🍲' },
  { name: 'Singhara (2)', cal: 180, emoji: '🥟' },
  { name: 'Puri (2)', cal: 220, emoji: '🫓' },
  { name: 'Samosa (1)', cal: 130, emoji: '🥟' },
  { name: 'Mishti doi', cal: 150, emoji: '🍮' },
  { name: 'Rasgolla (1)', cal: 100, emoji: '🍡' },
  { name: 'Muri (1 bowl)', cal: 110, emoji: '🥣' },
  { name: 'Banana (1)', cal: 90, emoji: '🍌' },
  { name: 'Orange (1)', cal: 60, emoji: '🍊' },
  { name: 'Milk (1 glass)', cal: 120, emoji: '🥛' },
  { name: 'Hilsa fish curry', cal: 230, emoji: '🐟' },
];

export function fuzzyMatchFood(query: string): BdFood | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  let best: BdFood | null = null;
  let bestScore = 0;

  for (const food of BD_FOODS) {
    const name = food.name.toLowerCase();
    if (name.includes(q) || q.includes(name.split(' ')[0])) {
      const score = name.includes(q) ? 2 : 1;
      if (score > bestScore) {
        bestScore = score;
        best = food;
      }
    }
  }

  return best;
}
