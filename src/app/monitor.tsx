import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useUserProfile } from '@/hooks/use-user-profile';
import { useFoodLog } from '@/hooks/use-food-log';
import { useAiCoach } from '@/hooks/use-ai-coach';
import { HealthScoreCard } from '@/components/monitor/health-score-card';
import { MetricCard } from '@/components/monitor/metric-card';
import { CalorieRing } from '@/components/monitor/calorie-ring';
import { MilestoneStepper } from '@/components/monitor/milestone-stepper';
import { FoodLogModal } from '@/components/food/food-log-modal';
import { calcTDEE, bmiCategory, calcCalorieTarget } from '@/lib/bmr-calculator';

export default function MonitorScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const [foodModal, setFoodModal] = useState(false);

  const { latestWeight, weeklyChange, kgLost, kgToGo, bmi, goalWeight, startWeight, paceStatus, targetDate } = useWeightLog();
  const { glasses, goal: waterGoal } = useWater();
  const { log, sleepGoalMet, moodGoodOrGreat } = useDailyLogs();
  const { steps, goal: stepGoal, goalReached } = usePedometer();
  const { streak } = useStreak();
  const { doneCount, totalCount, progressPct: checklistPct } = useDynamicChecklist();
  const { profile } = useUserProfile();
  const { entries: foodEntries, totalCalories, addEntry: addFoodEntry, deleteEntry: deleteFoodEntry } = useFoodLog();
  const { config: aiConfig, providerPresets } = useAiCoach();

  const score = useHealthScore({
    checklistPct,
    stepGoalReached: goalReached,
    waterGoalReached: glasses >= waterGoal,
    sleepGoalMet,
    weightTrendingDown: (weeklyChange ?? 0) < 0,
    moodGoodOrGreat,
  });

  const tdeeEst = Math.round(calcTDEE(profile));
  const calorieTarget = calcCalorieTarget(profile, paceStatus.onPace ? 0 : paceStatus.kcalAdjustment);
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

          {/* Calorie Ring */}
          <Text style={styles.sectionLabel}>FOOD & CALORIES</Text>
          <View style={styles.ringCard}>
            <CalorieRing consumed={totalCalories} target={calorieTarget} />
            <Pressable
              style={({ pressed }) => [styles.logFoodBtn, pressed && { opacity: 0.75 }]}
              onPress={() => setFoodModal(true)}>
              <Text style={styles.logFoodTxt}>+ Log Food</Text>
            </Pressable>
          </View>

          {/* Today's metrics */}
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

          {/* Weight journey milestone stepper */}
          <Text style={styles.sectionLabel}>WEIGHT JOURNEY</Text>
          <MilestoneStepper
            startKg={startWeight}
            goalKg={goalWeight}
            currentKg={latestWeight}
            weeklyChange={weeklyChange}
            paceStatus={paceStatus}
            targetDate={targetDate}
          />
        </SafeAreaView>
      </ScrollView>

      <FoodLogModal
        visible={foodModal}
        onClose={() => setFoodModal(false)}
        entries={foodEntries}
        totalCalories={totalCalories}
        calorieTarget={calorieTarget}
        onAdd={addFoodEntry}
        onDelete={deleteFoodEntry}
        aiConfig={aiConfig}
        providerPresets={providerPresets}
      />
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
  ringCard: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 10,
  },
  logFoodBtn: {
    backgroundColor: AppColors.green,
    borderRadius: 99,
    paddingHorizontal: 24,
    paddingVertical: 9,
  },
  logFoodTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.white,
  },
});
