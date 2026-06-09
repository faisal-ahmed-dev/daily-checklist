import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

import { AppColors, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useAiCoach } from '@/hooks/use-ai-coach';
import { useWeightLog } from '@/hooks/use-weight-log';
import { useWater } from '@/hooks/use-water';
import { useDailyLogs } from '@/hooks/use-daily-logs';
import { usePedometer } from '@/hooks/use-pedometer';
import { useStreak } from '@/hooks/use-streak';
import { useDynamicChecklist } from '@/hooks/use-dynamic-checklist';
import { useAnalytics } from '@/hooks/use-analytics';
import { useUserProfile } from '@/hooks/use-user-profile';
import { storageGet } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { AiCoachTab } from '@/components/ai/ai-coach-tab';
import type { CoachContext } from '@/hooks/use-ai-coach';

const NAME_KEY = '@user/name';

export default function AiScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const [userName, setUserName] = useState('Friend');

  const { messages, loading, error, sendMessage, clearMessages, generateDailyBrief, hasApiKey } =
    useAiCoach();
  const { latestWeight, weeklyChange, goalWeight, startWeight } = useWeightLog();
  const { glasses } = useWater();
  const { log } = useDailyLogs();
  const { steps, goal: stepGoal } = usePedometer();
  const { streak } = useStreak();
  const { doneCount, totalCount } = useDynamicChecklist();
  const { last7, perHabitRates } = useAnalytics();
  const { profile } = useUserProfile();

  useEffect(() => {
    storageGet<string>(NAME_KEY).then((n) => {
      if (n) setUserName(n);
    });
  }, []);

  if (!fontsLoaded) return null;

  const weeklyCompletionPcts = last7.map((d) => d.pct);

  // Identify weak and strong habits from per-habit rates
  const allHabits = Object.entries(perHabitRates);
  const weakHabits = allHabits
    .filter(([, rate]) => rate < 0.5)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([id]) => id.replace(/_/g, ' '));
  const strongHabits = allHabits
    .filter(([, rate]) => rate >= 0.8)
    .slice(0, 3)
    .map(([id]) => id.replace(/_/g, ' '));

  const ctx: CoachContext = {
    userName,
    currentWeight: latestWeight,
    goalWeight,
    startWeight,
    streak,
    doneCount,
    totalCount,
    stepsToday: steps,
    stepGoal,
    waterGlasses: glasses,
    sleepHours: log.sleepHours,
    weeklyCompletionPcts,
    weakHabits,
    strongHabits,
  };

  const dailyBrief = generateDailyBrief(ctx);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Coach</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {hasApiKey ? '● Connected' : '○ No key'}
            </Text>
          </View>
        </View>

        <AiCoachTab
          messages={messages}
          loading={loading}
          error={error}
          hasApiKey={hasApiKey}
          dailyBrief={dailyBrief}
          onSend={sendMessage}
          onClear={clearMessages}
          ctx={ctx}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.cream },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
    marginTop: 4,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    fontWeight: '600',
    color: AppColors.ink,
  },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
  },
  badgeText: {
    fontSize: 12,
    color: AppColors.muted,
    fontWeight: '500',
  },
});
