import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import {
  NOTIFICATION_SLOTS,
  cancelAllNotifications,
  requestNotificationPermission,
  scheduleNotifications,
  DEFAULT_BRIEF_TIME,
  type NotifSettings,
  type CustomReminder,
} from '@/lib/notification-tasks';

const NOTIF_KEY = '@notifications/settings';

const DEFAULT_ENABLED_IDS = NOTIFICATION_SLOTS.filter(
  (s) => s.id !== 'weigh-in'
).map((s) => s.id);

const DEFAULT_SETTINGS: NotifSettings = {
  enabled: false,
  enabledIds: DEFAULT_ENABLED_IDS,
  weeklyWeighIn: true,
  times: {},
  custom: [],
  dailyBrief: { enabled: false, hour: DEFAULT_BRIEF_TIME.hour, minute: DEFAULT_BRIEF_TIME.minute },
};

// Spread defaults over whatever was previously saved so older shapes
// (no `times` / `custom` / `dailyBrief`) migrate cleanly.
function migrate(saved: Partial<NotifSettings> | null): NotifSettings {
  if (!saved) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    times: saved.times ?? {},
    custom: saved.custom ?? [],
    dailyBrief: { ...DEFAULT_SETTINGS.dailyBrief, ...(saved.dailyBrief ?? {}) },
  };
}

function genId(): string {
  return `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    storageGet<Partial<NotifSettings>>(NOTIF_KEY).then((saved) => {
      setSettings(migrate(saved));
    });
  }, []);

  // Persist + (re)schedule when reminders are active.
  const commit = useCallback(async (next: NotifSettings) => {
    setSettings(next);
    await storageSet(NOTIF_KEY, next);
    if (next.enabled) {
      await scheduleNotifications(next);
    }
  }, []);

  const requestAndEnable = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      await commit({ ...settings, enabled: true });
    }
    return granted;
  }, [settings, commit]);

  const disable = useCallback(async () => {
    const next: NotifSettings = { ...settings, enabled: false };
    setSettings(next);
    await storageSet(NOTIF_KEY, next);
    await cancelAllNotifications();
  }, [settings]);

  const toggleSlot = useCallback(
    (id: string) => {
      const ids = settings.enabledIds.includes(id)
        ? settings.enabledIds.filter((x) => x !== id)
        : [...settings.enabledIds, id];
      return commit({ ...settings, enabledIds: ids });
    },
    [settings, commit]
  );

  const toggleWeighIn = useCallback(
    () => commit({ ...settings, weeklyWeighIn: !settings.weeklyWeighIn }),
    [settings, commit]
  );

  const setSlotTime = useCallback(
    (id: string, hour: number, minute: number) =>
      commit({ ...settings, times: { ...settings.times, [id]: { hour, minute } } }),
    [settings, commit]
  );

  const addCustomReminder = useCallback(
    (label: string, hour: number, minute: number) => {
      const reminder: CustomReminder = {
        id: genId(),
        label: label.trim(),
        title: label.trim(),
        body: label.trim(),
        hour,
        minute,
        enabled: true,
      };
      return commit({ ...settings, custom: [...settings.custom, reminder] });
    },
    [settings, commit]
  );

  const updateCustomReminder = useCallback(
    (id: string, patch: Partial<CustomReminder>) =>
      commit({
        ...settings,
        custom: settings.custom.map((r) =>
          r.id === id ? { ...r, ...patch, title: patch.label ?? r.title, body: patch.label ?? r.body } : r
        ),
      }),
    [settings, commit]
  );

  const deleteCustomReminder = useCallback(
    (id: string) => commit({ ...settings, custom: settings.custom.filter((r) => r.id !== id) }),
    [settings, commit]
  );

  const toggleDailyBrief = useCallback(
    () =>
      commit({
        ...settings,
        dailyBrief: { ...settings.dailyBrief, enabled: !settings.dailyBrief.enabled },
      }),
    [settings, commit]
  );

  const setBriefTime = useCallback(
    (hour: number, minute: number) =>
      commit({ ...settings, dailyBrief: { ...settings.dailyBrief, hour, minute } }),
    [settings, commit]
  );

  return {
    settings,
    permissionGranted,
    requestAndEnable,
    disable,
    toggleSlot,
    toggleWeighIn,
    setSlotTime,
    addCustomReminder,
    updateCustomReminder,
    deleteCustomReminder,
    toggleDailyBrief,
    setBriefTime,
  };
}
