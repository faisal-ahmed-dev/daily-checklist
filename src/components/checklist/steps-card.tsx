import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppColors } from '@/constants/theme';
import { estimateStepCalories } from '@/lib/step-utils';
import { NumberInputModal } from '@/components/number-input-modal';

type Props = {
  steps: number;
  goal: number;
  isStepTracking: boolean;
  goalReached: boolean;
  onSetSteps: (steps: number) => void;
  onSetGoal: (goal: number) => void;
};

const RADIUS = 46;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2 + 4;

function fmtSteps(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function StepsCard({ steps, goal, isStepTracking, goalReached, onSetSteps, onSetGoal }: Props) {
  const [stepModal, setStepModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);

  const pct = goal > 0 ? Math.min(steps / goal, 1) : 0;
  const offset = CIRCUMFERENCE - pct * CIRCUMFERENCE;
  const pctLabel = goal > 0 ? Math.round((steps / goal) * 100) : 0;
  const ringColor = goalReached ? AppColors.green : AppColors.amber;
  const kcal = estimateStepCalories(steps);

  // Milestone dots: evenly spaced from 0→goal, capped at 10 so large goals
  // don't overflow the row. Each dot fills once steps cross its threshold.
  const goalK = Math.max(1, Math.round(goal / 1000));
  const dotCount = Math.min(goalK, 10);
  const dots = Array.from({ length: dotCount }, (_, i) => ((i + 1) / dotCount) * goal);

  function openManualEntry() {
    setStepModal(true);
  }

  function handleCardPress() {
    // When auto-tracking, tapping shouldn't disrupt with a dialog.
    // When the sensor is unavailable, tap is the way to log steps.
    if (!isStepTracking) openManualEntry();
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={handleCardPress}
      onLongPress={openManualEntry}
      delayLongPress={400}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>👟 Steps</Text>
        {isStepTracking ? (
          <View style={styles.badgeAuto}>
            <View style={styles.liveDot} />
            <Text style={styles.badgeAutoText}>auto · live</Text>
          </View>
        ) : (
          <View style={styles.badgeManual}>
            <Text style={styles.badgeManualText}>✎ manual</Text>
          </View>
        )}
      </View>

      {/* Ring */}
      <View style={styles.body}>
        <View style={styles.ringWrap}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={AppColors.line}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={ringColor}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          </Svg>
          <View style={styles.center}>
            <Text style={[styles.count, { color: ringColor }]}>{fmtSteps(steps)}</Text>
            <Text style={styles.goal}>/ {fmtSteps(goal)}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Text style={[styles.pct, { color: ringColor }]}>{pctLabel}%</Text>
          <Text style={styles.pctLabel}>of goal</Text>
          <View style={styles.kcalRow}>
            <Text style={styles.kcalText}>🔥 ~{kcal} kcal</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
            onPress={openManualEntry}
            hitSlop={8}>
            <Text style={styles.editText}>✎ edit</Text>
          </Pressable>
        </View>
      </View>

      {/* Milestone dots + tappable goal */}
      <View style={styles.milestones}>
        {dots.map((threshold, i) => {
          const filled = steps >= threshold;
          const isGoal = i === dots.length - 1;
          return (
            <View
              key={i}
              style={[
                styles.mDot,
                filled && styles.mDotFilled,
                isGoal && !filled && styles.mDotGoal,
              ]}
            />
          );
        })}
        <Pressable
          style={({ pressed }) => [styles.goalChip, pressed && styles.pressed]}
          onPress={() => setGoalModal(true)}
          hitSlop={8}>
          <Text style={styles.goalChipText}>
            {goalReached ? '🎉 goal' : `Goal ${fmtSteps(goal)}`} ✎
          </Text>
        </Pressable>
      </View>

      <NumberInputModal
        visible={stepModal}
        initialValue={steps}
        title="Set steps"
        label="Manual step count (overrides the sensor for today)"
        min={0}
        max={100000}
        onCancel={() => setStepModal(false)}
        onSave={(n) => {
          onSetSteps(n);
          setStepModal(false);
        }}
      />
      <NumberInputModal
        visible={goalModal}
        initialValue={goal}
        title="Daily step goal"
        label="How many steps do you want to hit each day?"
        min={1000}
        max={50000}
        onCancel={() => setGoalModal(false)}
        onSave={(n) => {
          onSetGoal(n);
          setGoalModal(false);
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  pressed: { opacity: 0.7 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: { fontSize: 14, fontWeight: '700', color: AppColors.ink },
  badgeAuto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.greenLine,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: AppColors.green,
  },
  badgeAutoText: { fontSize: 10, fontWeight: '700', color: AppColors.greenDeep },
  badgeManual: {
    backgroundColor: AppColors.amberSoft,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeManualText: { fontSize: 10, fontWeight: '700', color: AppColors.amber },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  count: { fontSize: 22, fontWeight: '700' },
  goal: { fontSize: 12, color: AppColors.muted, marginTop: -1 },
  stats: { flex: 1, gap: 1 },
  pct: { fontSize: 26, fontWeight: '700' },
  pctLabel: { fontSize: 11, color: AppColors.muted, marginTop: -3 },
  kcalRow: { marginTop: 8 },
  kcalText: { fontSize: 13, fontWeight: '600', color: AppColors.ink },
  editBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  editText: { fontSize: 12, fontWeight: '600', color: AppColors.muted },
  milestones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.line,
  },
  mDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
    backgroundColor: AppColors.line,
  },
  mDotFilled: { backgroundColor: AppColors.green },
  mDotGoal: { borderWidth: 2, borderColor: AppColors.amber, backgroundColor: AppColors.paper },
  goalChip: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goalChipText: { fontSize: 11, color: AppColors.muted, fontWeight: '700' },
});
