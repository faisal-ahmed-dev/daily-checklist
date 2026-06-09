import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import {
  NOTIFICATION_SLOTS,
  cancelAllNotifications,
  requestNotificationPermission,
  scheduleNotifications,
} from '@/lib/notification-tasks';

type NotifSettings = {
  enabled: boolean;
  enabledIds: string[];
  weeklyWeighIn: boolean;
};

const NOTIF_KEY = '@notifications/settings';

const DEFAULT_ENABLED_IDS = NOTIFICATION_SLOTS.filter(
  (s) => s.id !== 'weigh-in'
).map((s) => s.id);

export function useNotifications() {
  const [settings, setSettings] = useState<NotifSettings>({
    enabled: false,
    enabledIds: DEFAULT_ENABLED_IDS,
    weeklyWeighIn: true,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    storageGet<NotifSettings>(NOTIF_KEY).then((saved) => {
      if (saved) setSettings(saved);
    });
  }, []);

  const requestAndEnable = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      const next: NotifSettings = { ...settings, enabled: true };
      setSettings(next);
      await storageSet(NOTIF_KEY, next);
      await scheduleNotifications(next.enabledIds, next.weeklyWeighIn);
    }
    return granted;
  }, [settings]);

  const disable = useCallback(async () => {
    const next: NotifSettings = { ...settings, enabled: false };
    setSettings(next);
    await storageSet(NOTIF_KEY, next);
    await cancelAllNotifications();
  }, [settings]);

  const toggleSlot = useCallback(
    async (id: string) => {
      const ids = settings.enabledIds.includes(id)
        ? settings.enabledIds.filter((x) => x !== id)
        : [...settings.enabledIds, id];
      const next: NotifSettings = { ...settings, enabledIds: ids };
      setSettings(next);
      await storageSet(NOTIF_KEY, next);
      if (settings.enabled) {
        await scheduleNotifications(ids, next.weeklyWeighIn);
      }
    },
    [settings]
  );

  const toggleWeighIn = useCallback(async () => {
    const next: NotifSettings = {
      ...settings,
      weeklyWeighIn: !settings.weeklyWeighIn,
    };
    setSettings(next);
    await storageSet(NOTIF_KEY, next);
    if (settings.enabled) {
      await scheduleNotifications(next.enabledIds, next.weeklyWeighIn);
    }
  }, [settings]);

  return {
    settings,
    permissionGranted,
    requestAndEnable,
    disable,
    toggleSlot,
    toggleWeighIn,
  };
}
