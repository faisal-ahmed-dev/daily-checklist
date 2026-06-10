import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';

type Props = {
  startKg: number;
  goalKg: number;
  currentKg: number | null;
  weeklyChange: number | null;
};

const MILESTONE_COUNT = 6;

function buildMilestones(start: number, goal: number): number[] {
  const milestones: number[] = [];
  for (let i = 0; i < MILESTONE_COUNT; i++) {
    const kg = start + ((goal - start) / (MILESTONE_COUNT - 1)) * i;
    milestones.push(Math.round(kg * 10) / 10);
  }
  return milestones;
}

function etaText(kgToGo: number, weeklyChange: number | null): string {
  if (!weeklyChange || weeklyChange >= 0) return 'Log more data for ETA';
  const weeksLeft = Math.ceil(kgToGo / Math.abs(weeklyChange));
  const eta = new Date();
  eta.setDate(eta.getDate() + weeksLeft * 7);
  return `${weeksLeft}w — ~${eta.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
}

export function MilestoneStepper({ startKg, goalKg, currentKg, weeklyChange }: Props) {
  const milestones = buildMilestones(startKg, goalKg);
  const current = currentKg ?? startKg;
  const kgToGo = Math.max(0, current - goalKg);

  // Find which milestone we're near
  const currentIdx = milestones.findIndex((m, i) => {
    const next = milestones[i + 1];
    return next == null ? true : current > m && current <= next ? false : current <= m;
  });
  const nextIdx = Math.max(0, milestones.findIndex((m) => m <= current) + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Journey</Text>

      {/* Milestone dots + line */}
      <View style={styles.track}>
        {milestones.map((m, i) => {
          const passed = current <= m; // we're losing weight toward goal
          const isNext = i === nextIdx && nextIdx < milestones.length;
          const isGoal = i === milestones.length - 1;

          return (
            <View key={m} style={styles.milestoneCol}>
              {/* Connector line (not for first) */}
              {i > 0 && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: current < milestones[i - 1] ? AppColors.green : AppColors.line },
                  ]}
                />
              )}
              {/* Dot */}
              <View
                style={[
                  styles.dot,
                  isGoal && styles.dotGoal,
                  isNext && styles.dotNext,
                  !passed && !isNext && styles.dotPassed,
                ]}>
                {isNext && <View style={styles.dotInner} />}
              </View>
              {/* Label */}
              <Text style={[styles.dotLabel, isNext && styles.dotLabelNext]}>
                {m}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ETA row */}
      <View style={styles.etaRow}>
        <Text style={styles.etaKey}>
          {weeklyChange != null && weeklyChange < 0
            ? `Losing ${Math.abs(weeklyChange).toFixed(1)} kg/wk`
            : 'No weekly data yet'}
        </Text>
        {kgToGo > 0 && (
          <Text style={styles.etaVal}>
            ETA: {etaText(kgToGo, weeklyChange)}
          </Text>
        )}
        {kgToGo === 0 && (
          <Text style={[styles.etaVal, { color: AppColors.green }]}>🎉 Goal reached!</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  title: { fontSize: 13, fontWeight: '700', color: AppColors.ink, marginBottom: 14 },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  milestoneCol: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  line: {
    position: 'absolute',
    top: 9,
    left: '-50%',
    right: '50%',
    height: 2,
    zIndex: 0,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 99,
    backgroundColor: AppColors.line,
    borderWidth: 2,
    borderColor: AppColors.line,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotPassed: {
    backgroundColor: AppColors.green,
    borderColor: AppColors.green,
  },
  dotNext: {
    backgroundColor: AppColors.paper,
    borderColor: AppColors.green,
    width: 22,
    height: 22,
    borderWidth: 3,
  },
  dotGoal: {
    borderColor: AppColors.amber,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: AppColors.green,
  },
  dotLabel: {
    fontSize: 9,
    color: AppColors.muted,
    marginTop: 4,
  },
  dotLabelNext: {
    color: AppColors.green,
    fontWeight: '700',
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: AppColors.line,
    marginTop: 4,
  },
  etaKey: { fontSize: 11, color: AppColors.muted },
  etaVal: { fontSize: 11, color: AppColors.ink, fontWeight: '600' },
});
