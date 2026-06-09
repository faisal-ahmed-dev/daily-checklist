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
    id: 'weigh-in',
    label: '7:00 AM — Weigh-in (Mon only)',
    hour: 7,
    minute: 0,
    title: 'Weigh-in day',
    body: 'Step on the scale — empty stomach, same time. Log it in the app.',
  },
];

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNotifications(
  enabledIds: string[],
  weeklyWeighInEnabled: boolean
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

  for (const slot of NOTIFICATION_SLOTS) {
    if (slot.id === 'weigh-in') {
      if (!weeklyWeighInEnabled) continue;
      // Schedule for every Monday
      await Notifications.scheduleNotificationAsync({
        content: { title: slot.title, body: slot.body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 2, // Monday
          hour: slot.hour,
          minute: slot.minute,
        },
      });
    } else {
      if (!enabledIds.includes(slot.id)) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: slot.title, body: slot.body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: slot.hour,
          minute: slot.minute,
        },
      });
    }
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
