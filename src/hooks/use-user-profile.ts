import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import type { UserProfile } from '@/lib/bmr-calculator';

const PROFILE_KEY = '@user/profile';

const DEFAULT_PROFILE: UserProfile = {
  weightKg: 89,
  heightCm: 170,
  ageYears: 30,
  gender: 'male',
  activityLevel: 'light',
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storageGet<UserProfile>(PROFILE_KEY).then((saved) => {
      if (saved) setProfile(saved);
      setLoaded(true);
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      storageSet(PROFILE_KEY, next);
      return next;
    });
  }, []);

  return { profile, updateProfile, loaded };
}
