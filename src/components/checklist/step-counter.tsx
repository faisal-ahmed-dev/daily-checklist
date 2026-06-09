import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppColors } from '@/constants/theme';

type Props = {
  steps: number;
  goal: number;
  isAvailable: boolean;
  compact?: boolean;
};

export function StepCounter({ steps, goal, isAvailable, compact = false }: Props) {
  const pct = Math.min(1, steps / goal);
  const radius = compact ? 22 : 36;
  const stroke = compact ? 4 : 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Svg width={radius * 2 + stroke} height={radius * 2 + stroke}>
        <Circle
          cx={radius + stroke / 2}
          cy={radius + stroke / 2}
          r={radius}
          stroke={AppColors.line}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={radius + stroke / 2}
          cy={radius + stroke / 2}
          r={radius}
          stroke={pct >= 1 ? AppColors.green : AppColors.amber}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          originX={radius + stroke / 2}
          originY={radius + stroke / 2}
        />
      </Svg>
      <View style={styles.label}>
        <Text style={[styles.count, compact && styles.countCompact]}>
          {steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps)}
        </Text>
        {!compact && (
          <Text style={styles.goalText}>/ {(goal / 1000).toFixed(0)}k steps</Text>
        )}
      </View>
      {!isAvailable && !compact && (
        <Text style={styles.manualNote}>manual</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {},
  label: {
    position: 'absolute',
    alignItems: 'center',
  },
  count: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.ink,
  },
  countCompact: {
    fontSize: 11,
  },
  goalText: {
    fontSize: 10,
    color: AppColors.muted,
    marginTop: 1,
  },
  manualNote: {
    fontSize: 9,
    color: AppColors.muted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
