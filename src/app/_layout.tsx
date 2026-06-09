import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { storageGet, storageSet } from '@/lib/storage';
import { scheduleNotifications } from '@/lib/notification-tasks';

// Set notification handler so alerts show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
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

  useEffect(() => {
    // Re-schedule notifications if they were enabled before (e.g. after reboot)
    storageGet<{ enabled: boolean; enabledIds: string[]; weeklyWeighIn: boolean }>(
      '@notifications/settings'
    ).then((saved) => {
      if (saved?.enabled) {
        scheduleNotifications(saved.enabledIds, saved.weeklyWeighIn).catch(() => {});
      }
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? customDark : customLight}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
