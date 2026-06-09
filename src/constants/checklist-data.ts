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
  start: number; // hour (24h), -1 = all day
  end: number;
  items: ChecklistItem[];
};

export const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    key: 'morning',
    title: 'Morning',
    time: 'before office',
    start: 5,
    end: 9,
    items: [
      {
        id: 'm_walk',
        main: '25–30 min morning walk',
        sub: 'Sector 6 Park or Sector 13 Lake Park',
      },
      {
        id: 'm_water',
        main: 'Glass of water on waking',
        sub: 'Before breakfast',
      },
      {
        id: 'm_break',
        main: 'Breakfast: 2 boiled eggs + 1 ruti/bread',
        sub: 'No butter',
      },
      {
        id: 'm_cha',
        main: 'Morning cha — no sugar or ½ tsp',
        sub: '',
      },
    ],
  },
  {
    key: 'day',
    title: 'Daytime',
    time: '8 AM – 5 PM',
    start: 9,
    end: 17,
    items: [
      {
        id: 'd_walkin',
        main: 'Walk the last 1–2 km into office',
        sub: 'Get off transport early',
      },
      {
        id: 'd_stairs',
        main: 'Stairs + stand/stretch every hour',
        sub: 'Break up the sitting',
      },
      {
        id: 'd_nescafe1',
        main: 'Nescafe 3-in-1 at 10 AM',
        sub: 'Have rong cha or water instead',
        avoid: true,
      },
      {
        id: 'd_lunch',
        main: 'Lunch: 1 cup rice max + curry + salad',
        sub: 'Fish day = best day. Fill plate with salad',
      },
      {
        id: 'd_nescafe2',
        main: 'Nescafe 3-in-1 at 4 PM',
        sub: 'Have a banana / boiled chola / muri instead',
        avoid: true,
      },
      {
        id: 'd_water',
        main: 'Drink water through the day (~2.5 L)',
        sub: 'Keep a bottle on your desk',
      },
    ],
  },
  {
    key: 'eve',
    title: 'Evening',
    time: 'after office',
    start: 17,
    end: 20,
    items: [
      {
        id: 'e_walkhome',
        main: 'Walk the last 1–2 km home',
        sub: 'Get off transport early',
      },
      {
        id: 'e_cha',
        main: 'Evening cha — no sugar or ½ tsp',
        sub: '',
      },
    ],
  },
  {
    key: 'dinner',
    title: 'Dinner',
    time: 'by 9 PM',
    start: 20,
    end: 23,
    items: [
      {
        id: 'n_early',
        main: 'Eat dinner by 9 PM',
        sub: 'Earlier is better than 10 PM',
      },
      {
        id: 'n_rice',
        main: '½–1 cup rice max + dal + curry + salad',
        sub: 'No second helping of rice',
      },
      {
        id: 'n_walk',
        main: '20 min walk after dinner',
        sub: 'Sector 6 or Sector 11 loop',
      },
      {
        id: 'n_closed',
        main: 'Kitchen closed after dinner',
        sub: 'No late-night snack',
      },
    ],
  },
  {
    key: 'rules',
    title: 'All-day rules',
    time: 'all day',
    start: -1,
    end: -1,
    items: [
      {
        id: 'r_drinks',
        main: 'Cold drinks, Frooti, packet juice',
        sub: 'Water & lebu pani only',
        avoid: true,
      },
      {
        id: 'r_street',
        main: 'Singara, samosa, paratha, fried snacks',
        sub: 'Save for one weekly cheat meal',
        avoid: true,
      },
      {
        id: 'r_steps',
        main: 'Hit step goal',
        sub: 'Month 1: 7,000 · Month 2: 8,500 · Month 3: 10,000',
      },
      {
        id: 'r_sleep',
        main: 'Plan to sleep 7+ hours tonight',
        sub: 'Protects metabolism & hunger control',
      },
    ],
  },
];

export const ALL_ITEM_IDS = CHECKLIST_SECTIONS.flatMap((s) =>
  s.items.map((i) => i.id)
);
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
  if (h >= 9 && h < 17) return 'At work — skip the Nescafe lattes, keep lunch rice to 1 cup.';
  if (h >= 17 && h < 20) return 'Heading home — walk the last stretch, no-sugar cha.';
  if (h >= 20 && h < 23)
    return 'Dinner — small rice + dal, then a short walk. Kitchen closes after.';
  return 'Late hours — wind down and protect your sleep.';
}

export const MOTIVATIONAL_QUOTES = [
  'Every 25-minute walk is a deposit into your future health.',
  'Discipline is choosing between what you want now and what you want most.',
  'The scale goes down when the kitchen closes on time.',
  '89 kg was day one. Every checked box is a step toward 70.',
  'You don\'t need to be perfect. You need to be consistent.',
  'One cup of rice at lunch adds up to everything.',
  'Your body changes in the kitchen. Your mood changes on the walk.',
  'Today\'s salad is tomorrow\'s lighter step.',
  'Small choices, compounded daily, create big results.',
  'Progress is not always visible on the scale. Trust the process.',
  'A good day starts with that morning walk.',
  'The Nescafe 3-in-1 is 140 kcal of nothing. Skip it.',
  'Sleep is not rest. Sleep is metabolism repair.',
  'Water first. Everything else second.',
  'Stairs are a free gym. Use them.',
  'Your future self will thank you for closing the kitchen tonight.',
  'Consistency beats perfection every single time.',
  'One less sugar in the cha is one less reason for your body to store fat.',
  'A 20-minute walk after dinner burns more than you think.',
  'Building the streak is building the habit.',
  'The goal is not a diet. The goal is a life you can sustain.',
  'Every morning you choose health, you win that day.',
  'Don\'t eat less. Eat right.',
  'Walking home is free cardio.',
  'The best time to start was yesterday. The next best time is now.',
  '70 kg is not a dream. It\'s a daily checklist.',
  'Fish is your best lunch friend.',
  'One salad at a time, one step at a time.',
  'You are stronger than the Nescafe craving.',
  'Sleep 7 hours and watch your hunger hormones behave.',
];
