import { useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';

const ONBOARDING_KEY = '@onboarding/complete';

export function useOnboarding() {
  const [complete, setComplete] = useState<boolean | null>(null);

  useEffect(() => {
    storageGet<boolean>(ONBOARDING_KEY).then((val) => {
      setComplete(val === true);
    });
  }, []);

  async function markComplete() {
    await storageSet(ONBOARDING_KEY, true);
    setComplete(true);
  }

  async function reset() {
    await storageSet(ONBOARDING_KEY, false);
    setComplete(false);
  }

  return {
    complete,
    loading: complete === null,
    markComplete,
    reset,
  };
}
