export type ChecklistItem = {
  id: string;
  main: string;
  sub: string;
  avoid?: boolean;
};

export type ChecklistSection = {
  key: string;
  title: string;
  time: string;
  start: number; // hour 24h, -1 = all day
  end: number;
  items: ChecklistItem[];
};

export const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    key: 'morning',
    title: 'Morning',
    time: 'before work',
    start: 5,
    end: 9,
    items: [
      { id: 'm_walk', main: '25–30 min morning walk', sub: 'Any park or route nearby' },
      { id: 'm_water', main: 'Glass of water on waking', sub: 'Before anything else' },
      { id: 'm_break', main: 'Healthy breakfast', sub: 'E.g. 2 boiled eggs + 1 roti/bread' },
      { id: 'm_cha', main: 'Morning tea — no or minimal sugar', sub: 'Skip sugary drinks' },
    ],
  },
  {
    key: 'day',
    title: 'Daytime',
    time: '9 AM – 5 PM',
    start: 9,
    end: 17,
    items: [
      { id: 'd_walkin', main: 'Walk the last 1–2 km to destination', sub: 'Get off transport early' },
      { id: 'd_stairs', main: 'Stairs + stand/stretch every hour', sub: 'Break up long sitting' },
      { id: 'd_sugary_am', main: 'Sugary hot drink at 10 AM', sub: 'Have plain tea or water instead', avoid: true },
      { id: 'd_lunch', main: 'Light lunch: 1 cup rice + protein + salad', sub: 'Salad should fill half the plate' },
      { id: 'd_sugary_pm', main: 'Sugary snack at 4 PM', sub: 'Have fruit, nuts, or water instead', avoid: true },
      { id: 'd_water', main: 'Drink water throughout the day (~2.5 L)', sub: 'Keep a bottle visible' },
    ],
  },
  {
    key: 'eve',
    title: 'Evening',
    time: 'after work',
    start: 17,
    end: 20,
    items: [
      { id: 'e_walkhome', main: 'Walk the last 1–2 km home', sub: 'Get off transport early' },
      { id: 'e_cha', main: 'Evening tea — no or minimal sugar', sub: '' },
    ],
  },
  {
    key: 'dinner',
    title: 'Dinner',
    time: 'by 9 PM',
    start: 20,
    end: 23,
    items: [
      { id: 'n_early', main: 'Eat dinner by 9 PM', sub: 'Earlier is better' },
      { id: 'n_rice', main: '½–1 cup rice max + protein + salad', sub: 'No second helping of rice' },
      { id: 'n_walk', main: '20 min walk after dinner', sub: 'Even a slow walk helps digestion' },
      { id: 'n_closed', main: 'No eating after dinner', sub: 'Kitchen is closed' },
    ],
  },
  {
    key: 'rules',
    title: 'All-day rules',
    time: 'all day',
    start: -1,
    end: -1,
    items: [
      { id: 'r_drinks', main: 'Sugary cold drinks, juice, soda', sub: 'Water, lemon water only', avoid: true },
      { id: 'r_street', main: 'Fried street snacks', sub: 'Save for one weekly treat', avoid: true },
      { id: 'r_steps', main: 'Hit daily step goal', sub: 'Week 1–4: 7,000 · Month 2: 8,500 · Month 3: 10,000' },
      { id: 'r_sleep', main: 'Sleep 7+ hours tonight', sub: 'Protects metabolism and hunger hormones' },
    ],
  },
];

export const ALL_ITEM_IDS = CHECKLIST_SECTIONS.flatMap((s) => s.items.map((i) => i.id));
export const TOTAL_ITEMS = ALL_ITEM_IDS.length;

export function getActiveSection(): string | null {
  const h = new Date().getHours();
  for (const s of CHECKLIST_SECTIONS) {
    if (s.start >= 0 && h >= s.start && h < s.end) return s.key;
  }
  return null;
}

export function getNowFocusText(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 9) return 'Morning — get your walk in, then a light breakfast.';
  if (h >= 9 && h < 17) return 'Daytime — skip the sugary drinks, keep lunch light.';
  if (h >= 17 && h < 20) return 'Heading home — walk the last stretch, light tea.';
  if (h >= 20 && h < 23) return 'Dinner — keep it light, then a short walk. Kitchen closes after.';
  return 'Late hours — wind down and protect your sleep.';
}

export const MOTIVATIONAL_QUOTES = [
  'Every 25-minute walk is a deposit into your future health.',
  'Discipline is choosing between what you want now and what you want most.',
  'The scale goes down when the kitchen closes on time.',
  'You don\'t need to be perfect. You need to be consistent.',
  'One cup of rice at lunch adds up to everything.',
  'Your body changes in the kitchen. Your mood changes on the walk.',
  'Small choices, compounded daily, create big results.',
  'Progress is not always visible on the scale. Trust the process.',
  'A good day starts with that morning walk.',
  'Sleep is not rest. Sleep is metabolism repair.',
  'Your future self will thank you for closing the kitchen tonight.',
  'Consistency beats perfection every single time.',
  'Building the streak is building the habit.',
  'The goal is not a diet. The goal is a sustainable life.',
  'Every morning you choose health, you win that day.',
  'Don\'t eat less. Eat right.',
  'Walking home is free cardio.',
  'The best time to start was yesterday. The next best time is now.',
  'You are stronger than any craving.',
  'Sleep 7 hours and watch your hunger hormones behave.',
  'Water first. Everything else second.',
  'Stairs are a free gym. Use them.',
  'One salad at a time, one step at a time.',
  'Focus on what you gain, not what you lose.',
  'Your habits today are your body tomorrow.',
  'A 20-minute walk after dinner burns more than you think.',
  'The habit you build now will outlast any diet.',
  'Every checked box is a step toward your goal.',
  'Don\'t wait for motivation. Build the system.',
  'You\'ve already started. Keep going.',
];
