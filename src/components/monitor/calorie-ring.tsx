import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppColors } from '@/constants/theme';

type Props = {
  consumed: number;
  target: number;
};

const RADIUS = 48;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2 + 4;

export function CalorieRing({ consumed, target }: Props) {
  const pct = target > 0 ? Math.min(consumed / target, 1.1) : 0;
  const offset = CIRCUMFERENCE - Math.min(pct, 1) * CIRCUMFERENCE;
  const over = consumed > target;
  const nearLimit = consumed >= target * 0.9 && !over;

  const ringColor = over
    ? '#DC2626'
    : nearLimit
    ? AppColors.amber
    : AppColors.green;

  const deficit = target - consumed;

  return (
    <View style={styles.container}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          {/* Track */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={AppColors.line}
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Fill */}
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
          <Text style={[styles.consumed, { color: ringColor }]}>{consumed}</Text>
          <Text style={styles.target}>/ {target}</Text>
          <Text style={styles.kcal}>kcal</Text>
        </View>
      </View>

      <Text style={[styles.deficitLabel, { color: ringColor }]}>
        {over
          ? `+${Math.abs(deficit)} kcal over target`
          : deficit === target
          ? 'No food logged yet'
          : `−${deficit} kcal deficit`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8 },
  ringWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  consumed: { fontSize: 22, fontWeight: '700' },
  target: { fontSize: 12, color: AppColors.muted },
  kcal: { fontSize: 10, color: AppColors.muted },
  deficitLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
});
