/**
 * Composite Health Score 0–100
 * Weights:
 *   Checklist completion today  25pts
 *   Step goal hit               20pts
 *   Water goal hit              15pts
 *   Sleep 7+ hours              15pts
 *   Weight trending down        15pts
 *   Mood good/great             10pts
 */

import { useMemo } from 'react';

export type ScoreInput = {
  checklistPct: number;        // 0–1
  stepGoalReached: boolean;
  waterGoalReached: boolean;   // glasses >= 8
  sleepGoalMet: boolean;       // sleepHours >= 7
  weightTrendingDown: boolean; // weeklyChange < 0
  moodGoodOrGreat: boolean;
};

export type ScoreBreakdown = {
  total: number;
  checklist: number;
  steps: number;
  water: number;
  sleep: number;
  weight: number;
  mood: number;
};

export function useHealthScore(input: ScoreInput): ScoreBreakdown {
  return useMemo(() => {
    const checklist = Math.round(input.checklistPct * 25);
    const steps = input.stepGoalReached ? 20 : Math.round(input.checklistPct * 10);
    const water = input.waterGoalReached ? 15 : 0;
    const sleep = input.sleepGoalMet ? 15 : 0;
    const weight = input.weightTrendingDown ? 15 : 0;
    const mood = input.moodGoodOrGreat ? 10 : 0;
    const total = checklist + steps + water + sleep + weight + mood;
    return { total, checklist, steps, water, sleep, weight, mood };
  }, [
    input.checklistPct,
    input.stepGoalReached,
    input.waterGoalReached,
    input.sleepGoalMet,
    input.weightTrendingDown,
    input.moodGoodOrGreat,
  ]);
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#2F6B4F'; // green
  if (score >= 60) return '#B8722A'; // amber
  return '#A03030'; // red
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Great';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs work';
}
