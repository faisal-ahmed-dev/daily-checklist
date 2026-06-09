import '@/global.css';
import { Platform } from 'react-native';

// Original cream palette from the HTML app
export const AppColors = {
  cream: '#FAF5EC',
  paper: '#FFFDF8',
  ink: '#2B2A26',
  muted: '#7C766B',
  line: '#E7DECE',

  green: '#2F6B4F',
  greenSoft: '#E4EFE7',
  greenLine: '#CDE3D4',
  greenDeep: '#1E4A36',

  amber: '#B8722A',
  amberSoft: '#FBEFDD',
  amberLine: '#EFD8B4',
  amberDeep: '#7E4D17',

  streakGold: '#D4A017',
  chartGoal: '#B05050',
  white: '#FFFFFF',
} as const;

export const Colors = {
  light: {
    text: AppColors.ink,
    background: AppColors.cream,
    backgroundElement: AppColors.paper,
    backgroundSelected: AppColors.greenSoft,
    textSecondary: AppColors.muted,
  },
  dark: {
    text: '#F4EFE2',
    background: '#1A1712',
    backgroundElement: '#252219',
    backgroundSelected: '#1E3028',
    textSecondary: '#9A9488',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'DMSans_400Regular',
    serif: 'Fraunces_600SemiBold',
    rounded: 'DMSans_500Medium',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
