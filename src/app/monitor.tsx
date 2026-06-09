import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

import { AppColors, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useWeightLog } from '@/hooks/use-weight-log';
import { useWater } from '@/hooks/use-water';
import { useDailyLogs } from '@/hooks/use-daily-logs';
import { usePedometer } from '@/hooks/use-pedometer';
import { useStreak } from '@/hooks/use-streak';
import { useDynamicChecklist } from '@/hooks/use-dynamic-checklist';
import { useHealthScore } from '@/hooks/use-health-score';
import { HealthScoreCard } from '@/components/monitor/health-score-card';
import { MetricCard } from '@/components/monitor/metric-card';
import { calcTDEE, bmiCategory } from '@/lib/bmr-calculator';
import { useUserProfile } from '@/hooks/use-user-profile';

export default function MonitorScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const { latestWeight, weeklyChange, kgLost, kgToGo, bmi, goalWeight, startWeight } = useWeightLog();
  const { glasses, goal: waterGoal } = useWater();
  const { log, sleepGoalMet, moodGoodOrGreat } = useDailyLogs();
  const { steps, goal: stepGoal, goalReached } = usePedometer();
  const { streak } = useStreak();
  const { doneCount, totalCount, progressPct: checklistPct } = useDynamicChecklist();
  const { profile } = useUserProfile();

  const score = useHealthScore({
    checklistPct,
    stepGoalReached: goalReached,
    waterGoalReached: glasses >= waterGoal,
    sleepGoalMet,
    weightTrendingDown: (weeklyChange ?? 0) < 0,
    moodGoodOrGreat,
  });

  const tdeeEst = Math.round(calcTDEE(profile));
  const bmiInfo = bmi ? bmiCategory(bmi) : null;

  if (!fontsLoaded) return null;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + 24 }]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Monitor</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak}</Text>
            </View>
          </View>

          {/* Health Score */}
          <HealthScoreCard score={score} />

          {/* Today's metrics — 2 per row */}
          <Text style={styles.sectionLabel}>TODAY</Text>
          <View style={styles.grid}>
            <MetricCard
              icon="⚖️"
              label="Weight"
              value={latestWeight ? `${latestWeight} kg` : '—'}
              sub={weeklyChange !== null ? `${weeklyChange > 0 ? '+' : ''}${weeklyChange} kg this week` : 'no trend yet'}
              progressPct={latestWeight && latestWeight > goalWeight ? (startWeight - latestWeight) / (startWeight - goalWeight) : 1}
              progressColor={AppColors.green}
            />
            <MetricCard
              icon="👟"
              label="Steps"
              value={steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps)}
              sub={`goal: ${(stepGoal / 1000).toFixed(0)}k`}
              progressPct={steps / stepGoal}
              progressColor={goalReached ? AppColors.green : AppColors.amber}
            />
          </View>

          <View style={styles.grid}>
            <MetricCard
              icon="💧"
              label="Water"
              value={`${glasses} / ${waterGoal}`}
              sub="glasses today"
              progressPct={glasses / waterGoal}
              progressColor={glasses >= waterGoal ? AppColors.green : '#5B8DB8'}
            />
            <MetricCard
              icon="😴"
              label="Sleep"
              value={log.sleepHours ? `${log.sleepHours}h` : '—'}
              sub={sleepGoalMet ? 'goal met ✓' : 'target: 7h+'}
              progressPct={log.sleepHours ? log.sleepHours / 9 : 0}
              progressColor={sleepGoalMet ? AppColors.green : AppColors.amber}
            />
          </View>

          <View style={styles.grid}>
            <MetricCard
              icon="😊"
              label="Mood"
              value={log.mood ? log.mood.charAt(0).toUpperCase() + log.mood.slice(1) : '—'}
              sub="how you feel today"
            />
            <MetricCard
              icon="🔥"
              label="Est. Burn"
              value={`~${tdeeEst} kcal`}
              sub="daily TDEE estimate"
            />
          </View>

          <View style={styles.grid}>
            <MetricCard
              icon="📋"
              label="Checklist"
              value={`${doneCount}/${totalCount}`}
              sub="habits today"
              progressPct={checklistPct}
              progressColor={checklistPct >= 0.8 ? AppColors.green : AppColors.amber}
            />
            {bmi && bmiInfo && (
              <MetricCard
                icon="📐"
                label="BMI"
                value={String(bmi)}
                sub={bmiInfo.label}
                progressPct={Math.min(1, bmi / 40)}
                progressColor={bmiInfo.color}
              />
            )}
          </View>

          {/* Weight progress */}
          <Text style={styles.sectionLabel}>WEIGHT JOURNEY</Text>
          <View style={styles.journeyCard}>
            <View style={styles.journeyRow}>
              <View style={styles.journeyItem}>
                <Text style={styles.journeyValue}>{kgLost.toFixed(1)}</Text>
                <Text style={styles.journeyLabel}>kg lost</Text>
              </View>
              <View style={styles.journeyItem}>
                <Text style={styles.journeyValue}>{kgToGo.toFixed(1)}</Text>
                <Text style={styles.journeyLabel}>kg to go</Text>
              </View>
              <View style={styles.journeyItem}>
                <Text style={styles.journeyValue}>{goalWeight}</Text>
                <Text style={styles.journeyLabel}>goal (kg)</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, ((startWeight - (latestWeight ?? startWeight)) / (startWeight - goalWeight)) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPct}>
              {latestWeight
                ? `${Math.round(((startWeight - latestWeight) / (startWeight - goalWeight)) * 100)}% to goal`
                : 'Log your first weight entry'}
            </Text>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.cream },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 14,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 4,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    fontWeight: '600',
    color: AppColors.ink,
  },
  streakBadge: {
    backgroundColor: AppColors.amberSoft,
    borderWidth: 1,
    borderColor: AppColors.amberLine,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  streakText: { fontSize: 14, fontWeight: '700', color: AppColors.amber },

  sectionLabel: {
    fontSize: 11,
    color: AppColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },

  grid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  journeyCard: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  journeyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  journeyItem: { alignItems: 'center', gap: 2 },
  journeyValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.ink,
  },
  journeyLabel: { fontSize: 11, color: AppColors.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  progressTrack: {
    height: 8,
    backgroundColor: AppColors.line,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.green,
    borderRadius: 99,
  },
  progressPct: {
    fontSize: 12,
    color: AppColors.muted,
    textAlign: 'right',
  },
});
