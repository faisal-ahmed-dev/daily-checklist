import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMilestoneMessage,
  STEP_MILESTONE_CHANNEL,
  STEP_INACTIVITY_CHANNEL,
} from '@/lib/step-utils';
import { NOTIF_CHANNELS, setupNotificationActions } from '@/lib/notification-tasks';
import { todayKey } from '@/lib/date-utils';
import type { FoodEntry } from '@/hooks/use-food-log';

export const STEP_INTEL_TASK = 'step-intel-task';

const KEYS = {
  lastMilestone: '@steps/last_milestone',
  lastCheckCount: '@steps/last_check_count',
  lastActiveTime: '@steps/last_active_time',
  lastInactivityNotif: '@steps/last_inactivity_notif',
  lastMicroBreak: '@steps/last_microbreak',
  lunchNudge: '@nudge/lunch',
  workoutNudge: '@nudge/workout',
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Minutes between office-hours desk-break nudges. */
const MICRO_BREAK_MIN = 50;

const CHANNELS = {
  stepMilestone: STEP_MILESTONE_CHANNEL,
  inactivity: STEP_INACTIVITY_CHANNEL,
};

export async function setupNotificationChannels() {
  await Notifications.setNotificationChannelAsync(CHANNELS.stepMilestone, {
    name: 'Step Milestones',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 80, 60, 80, 60, 80],
    enableVibrate: true,
    sound: null,
    showBadge: false,
  });

  await Notifications.setNotificationChannelAsync(CHANNELS.inactivity, {
    name: 'Inactivity Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 600],
    enableVibrate: true,
    sound: null,
    showBadge: false,
  });

  // Per-category channels so each reminder type can be muted/prioritized independently.
  const categoryChannels: { id: string; name: string }[] = [
    { id: NOTIF_CHANNELS.food, name: 'Food & Meals' },
    { id: NOTIF_CHANNELS.workout, name: 'Workouts & Movement' },
    { id: NOTIF_CHANNELS.water, name: 'Hydration' },
    { id: NOTIF_CHANNELS.weighin, name: 'Weigh-in & Logging' },
    { id: NOTIF_CHANNELS.brief, name: 'Daily Check-in' },
    { id: NOTIF_CHANNELS.general, name: 'General' },
  ];
  for (const c of categoryChannels) {
    await Notifications.setNotificationChannelAsync(c.id, {
      name: c.name,
      importance: Notifications.AndroidImportance.DEFAULT,
      enableVibrate: true,
      showBadge: false,
    });
  }

  // Register the tappable action buttons (water +1, did workout, snooze).
  await setupNotificationActions();
}

TaskManager.defineTask(STEP_INTEL_TASK, async () => {
  try {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const now = new Date();
    const hourNow = now.getHours();

    // Get current step count from hardware sensor
    const available = await Pedometer.isAvailableAsync().catch(() => false);
    if (!available) return BackgroundFetch.BackgroundFetchResult.NoData;

    const result = await Pedometer.getStepCountAsync(midnight, now).catch(() => null);
    if (!result) return BackgroundFetch.BackgroundFetchResult.Failed;

    const currentSteps = result.steps;

    // --- Step milestone notifications ---
    const raw = await AsyncStorage.getItem(KEYS.lastMilestone);
    const lastMilestone = raw ? parseInt(raw, 10) : 0;
    const goalRaw = await AsyncStorage.getItem('@pedometer/daily_goal');
    const goalSteps = goalRaw ? parseInt(goalRaw, 10) : 7000;

    const currentMilestone = Math.floor(currentSteps / 1000);
    if (currentMilestone > lastMilestone) {
      for (let m = lastMilestone + 1; m <= currentMilestone; m++) {
        const { title, body } = getMilestoneMessage(m, goalSteps);
        await Notifications.scheduleNotificationAsync({
          content: { title, body, sound: false },
          trigger: { channelId: CHANNELS.stepMilestone, seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
        });
      }
      await AsyncStorage.setItem(KEYS.lastMilestone, String(currentMilestone));
    }

    // --- Inactivity detection ---
    const lastCountRaw = await AsyncStorage.getItem(KEYS.lastCheckCount);
    const lastCount = lastCountRaw ? parseInt(lastCountRaw, 10) : 0;
    const lastActiveRaw = await AsyncStorage.getItem(KEYS.lastActiveTime);
    const lastActiveTime = lastActiveRaw ? parseInt(lastActiveRaw, 10) : Date.now();

    if (currentSteps > lastCount) {
      // User has moved — update active time
      await AsyncStorage.setItem(KEYS.lastActiveTime, String(Date.now()));
    } else if (hourNow >= 8 && hourNow < 21) {
      // Steps haven't changed — check for inactivity
      const minutesStill = (Date.now() - lastActiveTime) / 60000;
      if (minutesStill >= 60) {
        const lastNotifRaw = await AsyncStorage.getItem(KEYS.lastInactivityNotif);
        const lastNotifTime = lastNotifRaw ? parseInt(lastNotifRaw, 10) : 0;
        const minutesSinceNotif = (Date.now() - lastNotifTime) / 60000;

        if (minutesSinceNotif >= 90) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🚶 You\'ve been still for an hour',
              body: `Only ${currentSteps.toLocaleString()} steps so far. A 10-min walk burns ~50 kcal. Your body will thank you.`,
              sound: false,
            },
            trigger: { channelId: CHANNELS.inactivity, seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
          });
          await AsyncStorage.setItem(KEYS.lastInactivityNotif, String(Date.now()));
        }
      }
    }

    // --- Office-hours desk micro-break (stand + glute squeezes) ---
    const routineRaw = await AsyncStorage.getItem('@user/routine');
    let officeStart = 8;
    let officeEnd = 17;
    if (routineRaw) {
      try {
        const r = JSON.parse(routineRaw);
        if (typeof r?.officeStart?.hour === 'number') officeStart = r.officeStart.hour;
        if (typeof r?.officeEnd?.hour === 'number') officeEnd = r.officeEnd.hour;
      } catch {}
    }
    if (hourNow >= officeStart && hourNow < officeEnd) {
      const lastMbRaw = await AsyncStorage.getItem(KEYS.lastMicroBreak);
      const lastMb = lastMbRaw ? parseInt(lastMbRaw, 10) : 0;
      if ((Date.now() - lastMb) / 60000 >= MICRO_BREAK_MIN) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🧍 Desk break',
            body: 'Stand up: 10 glute squeezes + reach for the ceiling. 60 seconds resets your posture.',
            sound: false,
          },
          trigger: { channelId: CHANNELS.inactivity, seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
        });
        await AsyncStorage.setItem(KEYS.lastMicroBreak, String(Date.now()));
      }
    }

    // --- Conditional smart nudges (fire only when something's missing, app-closed) ---
    const today = todayKey();
    const food = safeParse<FoodEntry[]>(await AsyncStorage.getItem(`@food/log_${today}`), []);
    const loggedLunch = food.some((e) => e.time >= '11:30' && e.time <= '15:30' && e.calories >= 150);

    if (hourNow >= 14 && hourNow < 16 && !loggedLunch) {
      if ((await AsyncStorage.getItem(KEYS.lunchNudge)) !== today) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🍱 Lunch not logged',
            body: 'Catering: take the fish or chicken, 1 cup rice max, load the salad. Tap to log it.',
            sound: false,
          },
          trigger: { channelId: NOTIF_CHANNELS.food, seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
        });
        await AsyncStorage.setItem(KEYS.lunchNudge, today);
      }
    }

    const workoutDone = safeParse<string[]>(await AsyncStorage.getItem(`@workout/done_${today}`), []);
    if (hourNow >= 21 && hourNow < 23 && workoutDone.length === 0) {
      if ((await AsyncStorage.getItem(KEYS.workoutNudge)) !== today) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🍑 Workout still pending',
            body: 'Nothing checked off today. 10 min of glute bridges, squats & plank keeps the streak alive.',
            sound: false,
          },
          trigger: { channelId: NOTIF_CHANNELS.workout, seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
        });
        await AsyncStorage.setItem(KEYS.workoutNudge, today);
      }
    }

    // Save last check count (reset milestone counter at midnight)
    const isMidnightReset = lastCount > currentSteps;
    if (isMidnightReset) {
      await AsyncStorage.setItem(KEYS.lastMilestone, '0');
      await AsyncStorage.setItem(KEYS.lastActiveTime, String(Date.now()));
    }
    await AsyncStorage.setItem(KEYS.lastCheckCount, String(currentSteps));

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerStepIntelTask() {
  const status = await BackgroundFetch.getStatusAsync();
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) {
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(STEP_INTEL_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(STEP_INTEL_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}
