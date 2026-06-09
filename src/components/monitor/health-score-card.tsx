import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppColors } from '@/constants/theme';
import { scoreColor, scoreLabel } from '@/hooks/use-health-score';
import type { ScoreBreakdown } from '@/hooks/use-health-score';

type Props = {
  score: ScoreBreakdown;
};

export function HealthScoreCard({ score }: Props) {
  const radius = 52;
  const stroke = 9;
  const circumference = 2 * Math.PI * radius;
  const pct = score.total / 100;
  const dashOffset = circumference * (1 - pct);
  const color = scoreColor(score.total);
  const label = scoreLabel(score.total);

  const bars: { label: string; value: number; max: number; color: string }[] = [
    { label: 'Checklist', value: score.checklist, max: 25, color: AppColors.green },
    { label: 'Steps', value: score.steps, max: 20, color: AppColors.amber },
    { label: 'Water', value: score.water, max: 15, color: '#5B8DB8' },
    { label: 'Sleep', value: score.sleep, max: 15, color: '#8B6FCF' },
    { label: 'Weight', value: score.weight, max: 15, color: AppColors.green },
    { label: 'Mood', value: score.mood, max: 10, color: AppColors.streakGold },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {/* Ring */}
        <View style={styles.ringWrap}>
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
              stroke={color}
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
          <View style={styles.ringLabel}>
            <Text style={[styles.score, { color }]}>{score.total}</Text>
            <Text style={styles.scoreOf}>/100</Text>
            <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
          </View>
        </View>

        {/* Breakdown bars */}
        <View style={styles.breakdown}>
          {bars.map((b) => (
            <View key={b.label} style={styles.barRow}>
              <Text style={styles.barLabel}>{b.label}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(b.value / b.max) * 100}%`, backgroundColor: b.value > 0 ? b.color : AppColors.line },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{b.value}/{b.max}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  score: {
    fontSize: 26,
    fontWeight: '700',
  },
  scoreOf: {
    fontSize: 11,
    color: AppColors.muted,
    marginTop: -2,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  breakdown: {
    flex: 1,
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 11,
    color: AppColors.muted,
    width: 58,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: AppColors.line,
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
  },
  barValue: {
    fontSize: 10,
    color: AppColors.muted,
    width: 28,
    textAlign: 'right',
  },
});
