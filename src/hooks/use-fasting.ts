import { useCallback, useEffect, useRef, useState } from 'react';
import { storageGet, storageSet, storageRemove } from '@/lib/storage';

type FastState = {
  startTime: number; // epoch ms
  durationHours: number;
};

const FAST_KEY = '@fasting/current';

export function useFasting(durationHours: number = 16) {
  const [fastState, setFastState] = useState<FastState | null>(null);
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    storageGet<FastState>(FAST_KEY).then((saved) => {
      if (saved) setFastState(saved);
    });
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startFast = useCallback(() => {
    const state: FastState = { startTime: Date.now(), durationHours };
    setFastState(state);
    storageSet(FAST_KEY, state);
  }, [durationHours]);

  const stopFast = useCallback(() => {
    setFastState(null);
    storageRemove(FAST_KEY);
  }, []);

  if (!fastState) {
    return {
      isActive: false,
      startFast,
      stopFast,
      elapsedMs: 0,
      remainingMs: 0,
      progressPct: 0,
      elapsedHours: 0,
      goalHours: durationHours,
      isComplete: false,
    };
  }

  const elapsedMs = now - fastState.startTime;
  const goalMs = fastState.durationHours * 3600000;
  const remainingMs = Math.max(0, goalMs - elapsedMs);
  const progressPct = Math.min(1, elapsedMs / goalMs);
  const elapsedHours = elapsedMs / 3600000;
  const isComplete = elapsedMs >= goalMs;

  return {
    isActive: true,
    startFast,
    stopFast,
    elapsedMs,
    remainingMs,
    progressPct,
    elapsedHours,
    goalHours: fastState.durationHours,
    isComplete,
  };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}
