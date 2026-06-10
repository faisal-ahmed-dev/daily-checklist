import * as Notifications from 'expo-notifications';

export type NotificationSlot = {
  id: string;
  label: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
};

export const NOTIFICATION_SLOTS: NotificationSlot[] = [
  {
    id: 'morning-walk',
    label: '6:00 AM — Morning walk',
    hour: 6,
    minute: 0,
    title: 'Morning walk time',
    body: 'Head out for your 25–30 min walk before getting ready.',
  },
  {
    id: 'breakfast',
    label: '8:30 AM — Breakfast',
    hour: 8,
    minute: 30,
    title: "Breakfast time",
    body: '2 boiled eggs + 1 ruti. Don\'t skip — it controls lunch hunger.',
  },
  {
    id: 'skip-nescafe-am',
    label: '10:00 AM — Skip Nescafe',
    hour: 10,
    minute: 0,
    title: '10 AM — have rong cha',
    body: 'Skip the Nescafe 3-in-1. Have rong cha or water instead.',
  },
  {
    id: 'lunch',
    label: '1:00 PM — Lunch',
    hour: 13,
    minute: 0,
    title: 'Lunch time',
    body: '1 cup rice max. Fill the rest with salad. Fish day = best day.',
  },
  {
    id: 'snack-pm',
    label: '4:00 PM — Afternoon snack',
    hour: 16,
    minute: 0,
    title: '4 PM snack — not Nescafe',
    body: 'Banana, boiled chola, or muri. Skip the 3-in-1 latte.',
  },
  {
    id: 'evening-walk',
    label: '6:00 PM — Evening walk',
    hour: 18,
    minute: 0,
    title: 'Walk home',
    body: 'Get off transport 1–2 km early. Walk the last stretch.',
  },
  {
    id: 'dinner',
    label: '8:30 PM — Dinner',
    hour: 20,
    minute: 30,
    title: 'Dinner time',
    body: 'Eat now — earlier is better. ½–1 cup rice, then a 20-min walk.',
  },
  {
    id: 'kitchen-closed',
    label: '10:00 PM — Kitchen closed',
    hour: 22,
    minute: 0,
    title: 'Kitchen is closed',
    body: 'No late-night snacks. Wind down and protect your sleep.',
  },
  {
    id: 'sleep',
    label: '10:30 PM — Sleep',
    hour: 22,
    minute: 30,
    title: 'Time to sleep',
    body: 'Aim for 7+ hours. Sleep protects your metabolism and hunger control.',
  },
  {
    id: 'morning-exercise',
    label: '6:15 AM — Morning exercise',
    hour: 6,
    minute: 15,
    title: 'Morning exercise',
    body: '10 push-ups, 15 squats, 30s plank. Takes 5 minutes — just do it.',
  },
  {
    id: 'morning-stretch',
    label: '7:30 AM — Morning stretch',
    hour: 7,
    minute: 30,
    title: 'Morning stretch',
    body: 'Full-body stretch before heading out. 3–5 minutes. Improves posture.',
  },
  {
    id: 'daily-summary',
    label: '9:15 PM — Daily summary',
    hour: 21,
    minute: 15,
    title: "Today's summary",
    body: 'How did today go? Log your sleep and mood before winding down.',
  },
  {
    id: 'night-exercise',
    label: '9:00 PM — Evening workout',
    hour: 21,
    minute: 0,
    title: 'Evening workout',
    body: '15-min home workout: lunges, push-ups, crunches. Light and effective.',
  },
  {
    id: 'night-stretch',
    label: '10:00 PM — Night stretch',
    hour: 22,
    minute: 0,
    title: 'Wind-down stretch',
    body: 'Gentle stretches before sleep. Reduces cortisol, improves sleep quality.',
  },
  {
    id: 'water-am',
    label: '10:30 AM — Hydrate',
    hour: 10,
    minute: 30,
    title: '💧 Drink a glass of water',
    body: 'Mid-morning hydration. Aim for steady sips through the day.',
  },
  {
    id: 'water-pm',
    label: '3:30 PM — Hydrate',
    hour: 15,
    minute: 30,
    title: '💧 Water break',
    body: 'Afternoon glass of water — beats the 4 PM snack craving too.',
  },
  {
    id: 'water-eve',
    label: '7:30 PM — Hydrate',
    hour: 19,
    minute: 30,
    title: '💧 Evening water',
    body: 'One more glass before dinner. Keep that hydration up.',
  },
  {
    id: 'step-goal-nudge',
    label: '3:00 PM — Step check',
    hour: 15,
    minute: 0,
    title: '👟 How are your steps?',
    body: 'Check your step progress — a short walk now keeps you on track for your goal.',
  },
  {
    id: 'log-weight-mood',
    label: '9:00 PM — Log the day',
    hour: 21,
    minute: 0,
    title: '📝 Log today',
    body: "Record today's weight & mood before winding down. Small data, big insight.",
  },
  {
    id: 'weigh-in',
    label: '7:00 AM — Weigh-in (Mon only)',
    hour: 7,
    minute: 0,
    title: 'Weigh-in day',
    body: 'Step on the scale — empty stomach, same time. Log it in the app.',
  },
];

export type SlotTime = { hour: number; minute: number };

export type CustomReminder = {
  id: string;
  label: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  enabled: boolean;
};

export type DailyBriefSetting = { enabled: boolean; hour: number; minute: number };

export type NotifSettings = {
  enabled: boolean;
  enabledIds: string[];
  weeklyWeighIn: boolean;
  times: Record<string, SlotTime>;
  custom: CustomReminder[];
  dailyBrief: DailyBriefSetting;
};

export const DEFAULT_BRIEF_TIME: SlotTime = { hour: 8, minute: 0 };
const BRIEF_FALLBACK = "Open the app for today's check-in and focus.";

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNotifications(
  settings: NotifSettings,
  briefText?: string
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const timeFor = (id: string, slotHour: number, slotMinute: number): SlotTime =>
    settings.times[id] ?? { hour: slotHour, minute: slotMinute };

  // Built-in slots
  for (const slot of NOTIFICATION_SLOTS) {
    if (slot.id === 'weigh-in') {
      if (!settings.weeklyWeighIn) continue;
      const t = timeFor(slot.id, slot.hour, slot.minute);
      await Notifications.scheduleNotificationAsync({
        content: { title: slot.title, body: slot.body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 2, // Monday
          hour: t.hour,
          minute: t.minute,
        },
      });
    } else {
      if (!settings.enabledIds.includes(slot.id)) continue;
      const t = timeFor(slot.id, slot.hour, slot.minute);
      await Notifications.scheduleNotificationAsync({
        content: { title: slot.title, body: slot.body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: t.hour,
          minute: t.minute,
        },
      });
    }
  }

  // Custom user-defined reminders
  for (const r of settings.custom) {
    if (!r.enabled) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title || r.label, body: r.body || r.label, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: r.hour,
        minute: r.minute,
      },
    });
  }

  // Daily AI / smart brief
  if (settings.dailyBrief.enabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Your daily check-in',
        body: briefText && briefText.trim() ? briefText : BRIEF_FALLBACK,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.dailyBrief.hour,
        minute: settings.dailyBrief.minute,
      },
    });
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
