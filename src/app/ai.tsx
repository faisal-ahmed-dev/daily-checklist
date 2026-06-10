import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

import { AppColors, MaxContentWidth } from '@/constants/theme';
import { useAiCoach } from '@/hooks/use-ai-coach';
import { useWeightLog } from '@/hooks/use-weight-log';
import { useWater } from '@/hooks/use-water';
import { useDailyLogs } from '@/hooks/use-daily-logs';
import { usePedometer } from '@/hooks/use-pedometer';
import { useStreak } from '@/hooks/use-streak';
import { useDynamicChecklist } from '@/hooks/use-dynamic-checklist';
import { useAnalytics } from '@/hooks/use-analytics';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useAiContext } from '@/hooks/use-ai-context';
import { useFoodLog } from '@/hooks/use-food-log';
import { useEatingAgent } from '@/hooks/use-eating-agent';
import { calcCalorieTarget } from '@/lib/bmr-calculator';
import { storageGet } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { AiCoachTab } from '@/components/ai/ai-coach-tab';
import type { CoachContext } from '@/hooks/use-ai-coach';

const NAME_KEY = '@user/name';

export default function AiScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const [userName, setUserName] = useState('Friend');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const { messages, loading, error, sendMessage, clearMessages, generateDailyBrief, hasApiKey, config, providerPresets } =
    useAiCoach();
  const { latestWeight, weeklyChange, goalWeight, startWeight, paceStatus } = useWeightLog();
  const { glasses } = useWater();
  const { log } = useDailyLogs();
  const { steps, goal: stepGoal } = usePedometer();
  const { streak } = useStreak();
  const { doneCount, totalCount } = useDynamicChecklist();
  const { last7, perHabitRates } = useAnalytics();
  const { profile } = useUserProfile();
  const { getFieldsForPrompt } = useAiContext();
  const { entries: foodEntries, totalCalories, getLastNDays } = useFoodLog();
  const { zone } = useEatingAgent(foodEntries);

  useEffect(() => {
    storageGet<string>(NAME_KEY).then((n) => {
      if (n) setUserName(n);
    });
  }, []);

  if (!fontsLoaded) return null;

  const weeklyCompletionPcts = last7.map((d) => d.pct);
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

  const calorieTarget = calcCalorieTarget(profile, paceStatus.onPace ? 0 : paceStatus.kcalAdjustment);

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
    caloriesConsumed: totalCalories,
    calorieTarget,
    customContextFields:
      zone !== 'other'
        ? `${getFieldsForPrompt()}\nCurrently: ${zone === 'office' ? 'at the office' : 'at home'}`
        : getFieldsForPrompt(),
  };

  const dailyBrief = generateDailyBrief(ctx);

  async function generateWeeklyReport() {
    if (!hasApiKey) {
      setReportError('Add an API key in Settings → AI Coach to generate reports.');
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      const calDays = await getLastNDays(7);
      const avgCal = Math.round(calDays.reduce((s, d) => s + d.total, 0) / 7);
      const avgChecklistPct = weeklyCompletionPcts.length > 0
        ? Math.round(weeklyCompletionPcts.reduce((a, b) => a + b, 0) / weeklyCompletionPcts.length * 100)
        : 0;

      const prompt = `Generate a 7-day progress report for a weight-loss client. Be concise (3-5 short paragraphs) and end with exactly 3 action items for next week.

Data:
- Current weight: ${latestWeight ?? 'unknown'} kg (goal: ${goalWeight} kg, started: ${startWeight} kg)
- Weekly weight change: ${weeklyChange != null ? `${weeklyChange > 0 ? '+' : ''}${weeklyChange} kg` : 'no data'}
- Avg daily calories (7 days): ${avgCal} kcal (target: ${calorieTarget} kcal)
- Avg checklist completion: ${avgChecklistPct}%
- Current streak: ${streak} days
- Steps today: ${steps.toLocaleString()} / ${stepGoal.toLocaleString()} goal
- Weak habits: ${weakHabits.join(', ') || 'none yet'}
- Strong habits: ${strongHabits.join(', ') || 'building up'}
${getFieldsForPrompt() ? `- Personal context: ${getFieldsForPrompt()}` : ''}

Give an honest, encouraging analysis and 3 specific action items labelled "Action 1:", "Action 2:", "Action 3:".`;

      const preset = providerPresets[config.provider];
      const baseUrl = config.provider === 'custom' ? config.baseUrl : preset?.baseUrl;
      const model = config.provider === 'custom' ? config.model : preset?.model;

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a concise, data-driven weight-loss coach.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 600,
          temperature: 0.6,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      const text: string = json.choices?.[0]?.message?.content?.trim() ?? '';
      if (!text) throw new Error('Empty response');
      setReportText(text);
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  }

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

        {/* Weekly Report Card */}
        <View style={[styles.reportCard, { marginHorizontal: 14, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' }]}>
          <Pressable
            style={styles.reportHeader}
            onPress={() => {
              setReportOpen((v) => !v);
              if (!reportOpen && !reportText) generateWeeklyReport();
            }}>
            <Text style={styles.reportTitle}>📊 Weekly Report</Text>
            <Text style={styles.reportToggle}>{reportOpen ? '▲' : '▾ Generate'}</Text>
          </Pressable>

          {reportOpen && (
            <View style={styles.reportBody}>
              {reportLoading && (
                <View style={styles.reportLoading}>
                  <ActivityIndicator size="small" color={AppColors.green} />
                  <Text style={styles.reportLoadingTxt}>Analyzing your week…</Text>
                </View>
              )}
              {reportError && !reportLoading && (
                <Text style={styles.reportError}>{reportError}</Text>
              )}
              {reportText && !reportLoading && (
                <>
                  <ScrollView style={styles.reportScroll} nestedScrollEnabled>
                    <Text style={styles.reportText}>{reportText}</Text>
                  </ScrollView>
                  <Pressable
                    style={({ pressed }) => [styles.regenBtn, pressed && { opacity: 0.7 }]}
                    onPress={generateWeeklyReport}>
                    <Text style={styles.regenTxt}>↻ Regenerate</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
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
  badgeText: { fontSize: 12, color: AppColors.muted, fontWeight: '500' },

  reportCard: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  reportTitle: { fontSize: 14, fontWeight: '700', color: AppColors.ink },
  reportToggle: { fontSize: 13, color: AppColors.green, fontWeight: '600' },
  reportBody: {
    borderTopWidth: 1,
    borderTopColor: AppColors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reportLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  reportLoadingTxt: { fontSize: 13, color: AppColors.muted },
  reportError: { fontSize: 13, color: '#A03030', paddingVertical: 6 },
  reportScroll: { maxHeight: 240 },
  reportText: { fontSize: 13, color: AppColors.ink, lineHeight: 20 },
  regenBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: AppColors.greenSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  regenTxt: { fontSize: 12, color: AppColors.green, fontWeight: '600' },
});
