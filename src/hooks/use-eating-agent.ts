import { useCallback, useEffect, useState } from 'react';
import type { FoodEntry } from '@/hooks/use-food-log';
import {
  getZones,
  saveZone,
  requestLocationPermission,
  getCurrentPosition,
  classifyZone,
  type Zones,
  type ZoneName,
} from '@/lib/location-zones';

export type EatingSuggestion = { emoji: string; title: string; body: string };

const between = (t: string, lo: string, hi: string) => t >= lo && t <= hi;

/** Pure rule engine: zone + time + what's been logged → the right nudge (or null). */
export function eatingSuggestion(
  zone: ZoneName,
  hour: number,
  entries: FoodEntry[]
): EatingSuggestion | null {
  const loggedLunch = entries.some((e) => between(e.time, '11:30', '15:30') && e.calories >= 150);
  const loggedDinner = entries.some((e) => between(e.time, '19:00', '23:59') && e.calories >= 150);

  if (zone === 'office') {
    if (hour >= 9 && hour < 11)
      return { emoji: '☕', title: 'At the office', body: 'Skip the Nescafe 3-in-1 — have rong cha or water. Saves ~90 kcal of sugar.' };
    if (hour >= 11 && hour < 15 && !loggedLunch)
      return { emoji: '🍱', title: 'Catering time', body: 'Take the fish or chicken, 1 cup rice max, load up on salad. ~450 kcal. Fish day = best day.' };
    if (hour >= 15 && hour < 17)
      return { emoji: '🍌', title: '4 PM slump', body: 'Banana, boiled chola, or muri — not the sugary latte. Beats the crash.' };
    return null;
  }

  if (zone === 'home') {
    if (hour >= 6 && hour < 10)
      return { emoji: '🍳', title: 'Breakfast at home', body: '2 boiled eggs + 1 ruti, milk cha without sugar. Protein controls lunch hunger.' };
    if (hour >= 19 && hour < 24 && !loggedDinner)
      return { emoji: '🍛', title: 'Dinner at home', body: 'Earlier is better. ½–1 cup rice, extra veg, then a 20-min walk before bed.' };
    if (hour >= 22 || hour < 5)
      return { emoji: '🌙', title: 'Kitchen closed', body: 'No late-night snacking — protect your sleep and tomorrow’s appetite.' };
    return null;
  }

  return null; // 'other' — out and about, no location-specific nudge
}

export function useEatingAgent(foodEntries: FoodEntry[]) {
  const [zones, setZones] = useState<Zones>({ home: null, office: null });
  const [zone, setZone] = useState<ZoneName>('other');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const z = await getZones();
    setZones(z);
    if (!z.home && !z.office) return;
    const pos = await getCurrentPosition();
    setZone(classifyZone(pos, z));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Capture the current GPS spot as the home or office zone.
  const captureZone = useCallback(
    async (name: 'home' | 'office') => {
      setBusy(true);
      try {
        const granted = await requestLocationPermission();
        setPermissionGranted(granted);
        if (!granted) return false;
        const pos = await getCurrentPosition();
        if (!pos) return false;
        const next = await saveZone(name, pos);
        setZones(next);
        setZone(classifyZone(pos, next));
        return true;
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const suggestion = eatingSuggestion(zone, new Date().getHours(), foodEntries);
  const hasZones = !!(zones.home || zones.office);

  return { zone, zones, hasZones, suggestion, captureZone, refresh, permissionGranted, busy };
}
