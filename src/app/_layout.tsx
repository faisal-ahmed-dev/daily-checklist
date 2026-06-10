import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { storageGet } from '@/lib/storage';
import { scheduleNotifications, requestNotificationPermission, type NotifSettings } from '@/lib/notification-tasks';
import { registerStepIntelTask, setupNotificationChannels } from '@/lib/background-tasks';

// Import task definition so TaskManager knows about it at module load time
import '@/lib/background-tasks';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const customLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAF5EC',
    card: '#FFFDF8',
    text: '#2B2A26',
    border: '#E7DECE',
    primary: '#2F6B4F',
  },
};

const customDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#1A1712',
    card: '#252219',
    text: '#F4EFE2',
    border: '#3A3628',
    primary: '#5A9A7A',
  },
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      // Set up custom notification channels (Android only)
      if (Platform.OS === 'android') {
        await setupNotificationChannels().catch(() => {});
      }

      // Ask for notification permission so step milestones & inactivity
      // alerts can appear (required on Android 13+ / iOS).
      await requestNotificationPermission().catch(() => {});

      // Re-schedule daily reminders if previously enabled. Brief text falls
      // back to a generic line on cold launch; the Home screen upgrades it
      // with fresh (rule-based or AI) content once data is available.
      storageGet<NotifSettings>('@notifications/settings').then((saved) => {
        if (saved?.enabled) {
          scheduleNotifications({
            ...saved,
            times: saved.times ?? {},
            custom: saved.custom ?? [],
            dailyBrief: saved.dailyBrief ?? { enabled: false, hour: 8, minute: 0 },
          }).catch(() => {});
        }
      });

      // Register background step intel task
      registerStepIntelTask().catch(() => {});

      // Check onboarding state
      const onboardingComplete = await storageGet<boolean>('@onboarding/complete');
      if (!onboardingComplete) {
        setTimeout(() => router.replace('/onboarding' as any), 100);
      }
    }

    init();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? customDark : customLight}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
