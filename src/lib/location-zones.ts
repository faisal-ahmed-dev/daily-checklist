import * as Location from 'expo-location';
import { storageGet, storageSet } from '@/lib/storage';

export type Zone = { lat: number; lng: number };
export type Zones = { home: Zone | null; office: Zone | null };
export type ZoneName = 'home' | 'office' | 'other';

export const ZONES_KEY = '@location/zones';

/** A position counts as "in" a saved zone within this radius. */
const RADIUS_M = 200;

export async function getZones(): Promise<Zones> {
  return (await storageGet<Zones>(ZONES_KEY)) ?? { home: null, office: null };
}

export async function saveZone(name: 'home' | 'office', zone: Zone): Promise<Zones> {
  const zones = await getZones();
  const next = { ...zones, [name]: zone };
  await storageSet(ZONES_KEY, next);
  return next;
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** One-shot current position, or null if unavailable / denied. */
export async function getCurrentPosition(): Promise<Zone | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

/** Great-circle distance in metres. */
export function distanceM(a: Zone, b: Zone): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function classifyZone(pos: Zone | null, zones: Zones): ZoneName {
  if (!pos) return 'other';
  if (zones.office && distanceM(pos, zones.office) <= RADIUS_M) return 'office';
  if (zones.home && distanceM(pos, zones.home) <= RADIUS_M) return 'home';
  return 'other';
}
