import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';
import type { MoodLevel } from '@/hooks/use-daily-logs';
import { MOOD_OPTIONS, SLEEP_OPTIONS } from '@/hooks/use-daily-logs';

type Props = {
  waterGlasses: number;
  waterGoal: number;
  sleepHours: number | null;
  mood: MoodLevel | null;
  onAddWater: () => void;
  onSetWater: (glasses: number) => void;
  onSetSleep: (hours: number) => void;
  onSetMood: (mood: MoodLevel) => void;
};

export function VitalsRow({
  waterGlasses,
  waterGoal,
  sleepHours,
  mood,
  onAddWater,
  onSetWater,
  onSetSleep,
  onSetMood,
}: Props) {
  function handleWaterLongPress() {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Set water',
        'How many glasses? (0–20)',
        (text) => {
          const n = parseInt(text, 10);
          if (!isNaN(n) && n >= 0 && n <= 20) onSetWater(n);
        },
        'plain-text',
        String(waterGlasses),
        'numeric'
      );
    } else {
      // Android: show quick-set options
      const opts = [0, 2, 4, 6, 8, 10, 12].map((n) => ({
        text: `${n} glasses`,
        onPress: () => onSetWater(n),
      }));
      Alert.alert('Set water glasses', '', opts, { cancelable: true });
    }
  }

  function handleSleepTap() {
    Alert.alert(
      'Last night sleep',
      'How many hours?',
      SLEEP_OPTIONS.map((h) => ({
        text: `${h}h`,
        onPress: () => onSetSleep(h),
      })),
      { cancelable: true }
    );
  }

  function handleMoodTap() {
    Alert.alert(
      'How are you feeling?',
      '',
      MOOD_OPTIONS.map((m) => ({
        text: `${m.emoji} ${m.label}`,
        onPress: () => onSetMood(m.value),
      })),
      { cancelable: true }
    );
  }

  const moodEmoji = mood ? MOOD_OPTIONS.find((m) => m.value === mood)?.emoji ?? '😐' : '😐';
  const sleepLabel = sleepHours ? `${sleepHours}h` : '—';

  return (
    <View style={styles.row}>
      {/* Water — tap +1, long press set exact */}
      <Pressable
        style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        onPress={onAddWater}
        onLongPress={handleWaterLongPress}
        delayLongPress={400}>
        <Text style={styles.tileIcon}>💧</Text>
        <Text style={styles.tileValue}>
          {waterGlasses}/{waterGoal}
        </Text>
        <Text style={styles.tileLabel}>glasses</Text>
      </Pressable>

      {/* Sleep */}
      <Pressable
        style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        onPress={handleSleepTap}>
        <Text style={styles.tileIcon}>😴</Text>
        <Text style={styles.tileValue}>{sleepLabel}</Text>
        <Text style={styles.tileLabel}>sleep</Text>
      </Pressable>

      {/* Mood */}
      <Pressable
        style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        onPress={handleMoodTap}>
        <Text style={styles.tileIcon}>{moodEmoji}</Text>
        <Text style={styles.tileValue}>
          {mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : '—'}
        </Text>
        <Text style={styles.tileLabel}>mood</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  pressed: { opacity: 0.7 },
  tileIcon: { fontSize: 17 },
  tileValue: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.ink,
  },
  tileLabel: {
    fontSize: 10,
    color: AppColors.muted,
  },
});
