import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { AppColors } from '@/constants/theme';
import { useFasting, formatDuration } from '@/hooks/use-fasting';

type Props = { durationHours?: number };

export function FastingTimer({ durationHours = 16 }: Props) {
  const { isActive, startFast, stopFast, remainingMs, progressPct, elapsedHours, isComplete } =
    useFasting(durationHours);

  const size = 80;
  const radius = 33;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPct);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Intermittent Fasting</Text>
        <Text style={styles.subtitle}>{durationHours}:8 protocol</Text>
      </View>

      <View style={styles.body}>
        {/* Ring progress */}
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={AppColors.line}
            strokeWidth={7}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={AppColors.green}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <SvgText
            x={size / 2}
            y={size / 2 - 3}
            textAnchor="middle"
            fontSize={13}
            fontWeight="600"
            fill={AppColors.ink}>
            {isActive ? Math.floor(elapsedHours) + 'h' : '—'}
          </SvgText>
          <SvgText
            x={size / 2}
            y={size / 2 + 11}
            textAnchor="middle"
            fontSize={9}
            fill={AppColors.muted}>
            {isActive ? (isComplete ? 'done!' : 'fasted') : 'inactive'}
          </SvgText>
        </Svg>

        <View style={styles.info}>
          {isActive ? (
            isComplete ? (
              <Text style={[styles.timer, styles.timerDone]}>Fast complete! 🎉</Text>
            ) : (
              <>
                <Text style={styles.timerLabel}>Eating window opens in</Text>
                <Text style={styles.timer}>{formatDuration(remainingMs)}</Text>
              </>
            )
          ) : (
            <Text style={styles.timerLabel}>Start a {durationHours}-hour fast</Text>
          )}

          <Pressable
            onPress={isActive ? stopFast : startFast}
            style={({ pressed }) => [
              styles.btn,
              isActive && styles.btnStop,
              pressed && styles.btnPressed,
            ]}>
            <Text style={styles.btnText}>{isActive ? 'Stop Fast' : 'Start Fast'}</Text>
          </Pressable>
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
    padding: 15,
    marginBottom: 14,
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.ink,
  },
  subtitle: {
    fontSize: 12,
    color: AppColors.muted,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  timerLabel: {
    fontSize: 12,
    color: AppColors.muted,
  },
  timer: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.ink,
    fontFamily: 'Fraunces_600SemiBold',
  },
  timerDone: {
    color: AppColors.green,
  },
  btn: {
    backgroundColor: AppColors.green,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  btnStop: {
    backgroundColor: AppColors.amberDeep,
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
