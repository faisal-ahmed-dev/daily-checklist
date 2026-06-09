import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { AppColors } from '@/constants/theme';
import type { WeightEntry } from '@/hooks/use-weight-log';
import { shortDate } from '@/lib/date-utils';

type Props = {
  entries: WeightEntry[];
  goalWeight: number;
  width?: number;
};

export function WeightChart({ entries, goalWeight, width = 320 }: Props) {
  const height = 180;
  const padLeft = 36;
  const padRight = 10;
  const padTop = 16;
  const padBottom = 28;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Take last 30 entries sorted oldest→newest
  const sorted = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  if (sorted.length < 2) {
    return (
      <View style={[styles.card, { width }]}>
        <Text style={styles.title}>Weight Trend</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Log at least 2 entries to see your trend chart.</Text>
        </View>
      </View>
    );
  }

  const weights = sorted.map((e) => e.kg);
  const minW = Math.min(...weights, goalWeight) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  function toX(i: number) {
    return padLeft + (i / (sorted.length - 1)) * chartW;
  }
  function toY(kg: number) {
    return padTop + ((maxW - kg) / range) * chartH;
  }

  // Build SVG path
  const pathD = sorted
    .map((e, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(e.kg)}`)
    .join(' ');

  const goalY = toY(goalWeight);

  // Label indices: first, last, and every 7th
  const labelIndices = new Set<number>([0, sorted.length - 1]);
  for (let i = 7; i < sorted.length - 1; i += 7) labelIndices.add(i);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Weight Trend (last {sorted.length} entries)</Text>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Goal line */}
        <Line
          x1={padLeft}
          y1={goalY}
          x2={width - padRight}
          y2={goalY}
          stroke={AppColors.chartGoal}
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.6}
        />
        <SvgText
          x={padLeft + 2}
          y={goalY - 3}
          fontSize={9}
          fill={AppColors.chartGoal}
          opacity={0.8}>
          {goalWeight}kg goal
        </SvgText>

        {/* Y-axis labels */}
        {[minW + 1, Math.round((minW + maxW) / 2), maxW - 1].map((w) => (
          <SvgText
            key={w}
            x={padLeft - 4}
            y={toY(w) + 4}
            fontSize={9}
            textAnchor="end"
            fill={AppColors.muted}>
            {w}
          </SvgText>
        ))}

        {/* Line */}
        <Path
          d={pathD}
          stroke={AppColors.green}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {sorted.map((e, i) => (
          <Circle
            key={e.id}
            cx={toX(i)}
            cy={toY(e.kg)}
            r={i === sorted.length - 1 ? 4 : 2.5}
            fill={i === sorted.length - 1 ? AppColors.green : AppColors.greenLine}
          />
        ))}

        {/* X-axis labels */}
        {sorted.map((e, i) =>
          labelIndices.has(i) ? (
            <SvgText
              key={e.id + '_lbl'}
              x={toX(i)}
              y={height - 4}
              fontSize={8}
              textAnchor="middle"
              fill={AppColors.muted}>
              {shortDate(e.date)}
            </SvgText>
          ) : null
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.ink,
    marginBottom: 8,
  },
  empty: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: AppColors.muted,
    textAlign: 'center',
  },
});
