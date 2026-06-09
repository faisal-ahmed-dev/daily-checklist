import { useCallback, useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';

const STEPS_KEY = (date: string) => `@pedometer/steps_${date}`;
const GOAL_KEY = '@pedometer/daily_goal';
const DEFAULT_GOAL = 7000;

export function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [manualSteps, setManualStepsState] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [goal, setGoalState] = useState(DEFAULT_GOAL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;

    async function init() {
      const [savedGoal, savedManual] = await Promise.all([
        storageGet<number>(GOAL_KEY),
        storageGet<number>(STEPS_KEY(todayKey())),
      ]);
      if (savedGoal) setGoalState(savedGoal);
      if (savedManual !== null) setManualStepsState(savedManual);

      const available = await Pedometer.isAvailableAsync().catch(() => false);
      setIsAvailable(available);

      if (available) {
        // Get steps since midnight today
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        try {
          const result = await Pedometer.getStepCountAsync(midnight, new Date());
          if (result) setSteps(result.steps);
        } catch {}

        // Live subscription
        subscription = Pedometer.watchStepCount((result) => {
          setSteps(result.steps);
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
  }, []);

  const setGoal = useCallback((newGoal: number) => {
    setGoalState(newGoal);
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
