import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { ROUTINE_KEY, DEFAULT_ROUTINE, type UserRoutine } from '@/lib/user-routine';
import { scheduleNotifications, type NotifSettings } from '@/lib/notification-tasks';

const NOTIF_KEY = '@notifications/settings';

export function useRoutine() {
  const [routine, setRoutine] = useState<UserRoutine>(DEFAULT_ROUTINE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storageGet<UserRoutine>(ROUTINE_KEY).then((saved) => {
      if (saved) setRoutine({ ...DEFAULT_ROUTINE, ...saved });
      setLoaded(true);
    });
  }, []);

  // Persist a routine change and reschedule notifications so the new times take effect.
  const updateRoutine = useCallback(async (updates: Partial<UserRoutine>) => {
    let next: UserRoutine = DEFAULT_ROUTINE;
    setRoutine((prev) => {
      next = { ...prev, ...updates };
      return next;
    });
    await storageSet(ROUTINE_KEY, next);
    const notif = await storageGet<NotifSettings>(NOTIF_KEY);
    if (notif?.enabled) await scheduleNotifications(notif);
  }, []);

  return { routine, updateRoutine, loaded };
}
