import { useCallback, useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import { Pedometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';
import { getMilestoneMessage, STEP_MILESTONE_CHANNEL } from '@/lib/step-utils';

const STEPS_KEY = (date: string) => `@pedometer/steps_${date}`;
const GOAL_KEY = '@pedometer/daily_goal';
const DEFAULT_GOAL = 7000;

// Custom vibration patterns — distinct from any standard phone notification
const VIBRATE_MILESTONE = [0, 80, 60, 80, 60, 80];      // 3 short pulses
const VIBRATE_HALFWAY = [0, 150, 80, 150, 80, 150];      // 3 medium pulses
const VIBRATE_GOAL = [0, 400, 120, 200, 120, 400];       // long-short-long (celebration)

export function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [manualSteps, setManualStepsState] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [goal, setGoalState] = useState(DEFAULT_GOAL);
  const [loaded, setLoaded] = useState(false);
  const lastMilestoneRef = useRef(-1);
  const goalReachedRef = useRef(false);

  function triggerMilestoneVibration(milestone: number, goalSteps: number) {
    if (milestone * 1000 >= goalSteps && !goalReachedRef.current) {
      goalReachedRef.current = true;
      Vibration.vibrate(VIBRATE_GOAL);
    } else if (milestone === Math.floor(goalSteps / 2000)) {
      Vibration.vibrate(VIBRATE_HALFWAY);
    } else {
      Vibration.vibrate(VIBRATE_MILESTONE);
    }
    fireMilestoneNotification(milestone, goalSteps);
  }

  function fireMilestoneNotification(milestone: number, goalSteps: number) {
    const { title, body } = getMilestoneMessage(milestone, goalSteps);
    Notifications.scheduleNotificationAsync({
      content: { title, body, sound: false },
      trigger: {
        channelId: STEP_MILESTONE_CHANNEL,
        seconds: 1,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    }).catch(() => {});
  }

  function checkMilestones(newSteps: number, goalSteps: number) {
    const milestone = Math.floor(newSteps / 1000);
    if (milestone > lastMilestoneRef.current && lastMilestoneRef.current >= 0) {
      triggerMilestoneVibration(milestone, goalSteps);
    }
    lastMilestoneRef.current = milestone;
  }

  useEffect(() => {
    let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;

    async function init() {
      const [savedGoal, savedManual] = await Promise.all([
        storageGet<number>(GOAL_KEY),
        storageGet<number>(STEPS_KEY(todayKey())),
      ]);
      const goalSteps = savedGoal ?? DEFAULT_GOAL;
      if (savedGoal) setGoalState(goalSteps);
      if (savedManual !== null) setManualStepsState(savedManual);

      const available = await Pedometer.isAvailableAsync().catch(() => false);
      setIsAvailable(available);

      if (available) {
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        try {
          const result = await Pedometer.getStepCountAsync(midnight, new Date());
          if (result) {
            setSteps(result.steps);
            // Initialize milestone ref without vibrating (don't vibrate on app open)
            lastMilestoneRef.current = Math.floor(result.steps / 1000);
            goalReachedRef.current = result.steps >= goalSteps;
          }
        } catch {}

        subscription = Pedometer.watchStepCount((result) => {
          setSteps((prev) => {
            if (result.steps !== prev) {
              checkMilestones(result.steps, goalSteps);
            }
            return result.steps;
          });
        });
      }

      setLoaded(true);
    }

    init();
    return () => {
      subscription?.remove();
    };
  }, []);

  const setManualSteps = useCallback((count: number) => {
    setManualStepsState(count);
    storageSet(STEPS_KEY(todayKey()), count);
    // Check milestones for manual override too
    checkMilestones(count, goal);
  }, [goal]);

  const setGoal = useCallback((newGoal: number) => {
    setGoalState(newGoal);
    goalReachedRef.current = false;
    storageSet(GOAL_KEY, newGoal);
  }, []);

  const effectiveSteps = isAvailable ? steps : (manualSteps ?? 0);
  const progressPct = Math.min(1, effectiveSteps / goal);
  const goalReached = effectiveSteps >= goal;

  return {
    steps: effectiveSteps,
    rawSensorSteps: steps,
    manualSteps,
    isAvailable,
    goal,
    progressPct,
    goalReached,
    loaded,
    setManualSteps,
    setGoal,
  };
}
