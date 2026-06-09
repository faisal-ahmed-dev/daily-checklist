import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';

type Props = {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  progressPct?: number;
  progressColor?: string;
  onPress?: () => void;
};

export function MetricCard({ icon, label, value, sub, progressPct, progressColor, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.top}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.textWrap}>
          <Text style={styles.value}>{value}</Text>
          {sub && <Text style={styles.sub}>{sub}</Text>}
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      {progressPct !== undefined && (
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.min(100, progressPct * 100)}%`,
                backgroundColor: progressColor ?? AppColors.green,
              },
            ]}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 14,
    padding: 12,
    minHeight: 72,
    gap: 4,
  },
  pressed: { opacity: 0.7 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  icon: { fontSize: 18 },
  textWrap: { flex: 1 },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.ink,
  },
  sub: {
    fontSize: 11,
    color: AppColors.muted,
  },
  label: {
    fontSize: 11,
    color: AppColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  track: {
    height: 4,
    backgroundColor: AppColors.line,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
});
