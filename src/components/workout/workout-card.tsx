import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';
import type { WorkoutSession } from '@/lib/workout-program';

type Props = {
  week: number;
  am: WorkoutSession;
  pm: WorkoutSession;
  isDone: (id: string) => boolean;
  onToggle: (id: string) => void;
};

export function WorkoutCard({ week, am, pm, isDone, onToggle }: Props) {
  // Default to the session that fits the time of day; user can switch.
  const [slot, setSlot] = useState<'am' | 'pm'>(new Date().getHours() < 14 ? 'am' : 'pm');
  const session = slot === 'am' ? am : pm;
  const doneCount = session.exercises.filter((e) => isDone(e.id)).length;
  const total = session.exercises.length;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{session.title}</Text>
          <Text style={styles.sub}>
            Week {week + 1} · {session.durationLabel} · belly + glutes
          </Text>
        </View>
        <View style={styles.toggle}>
          {(['am', 'pm'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSlot(s)}
              style={[styles.toggleBtn, slot === s && styles.toggleBtnActive]}>
              <Text style={[styles.toggleText, slot === s && styles.toggleTextActive]}>
                {s.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${total ? (doneCount / total) * 100 : 0}%` }]} />
      </View>

      <View style={styles.list}>
        {session.exercises.map((ex) => {
          const done = isDone(ex.id);
          return (
            <Pressable
              key={ex.id}
              onPress={() => onToggle(ex.id)}
              style={({ pressed }) => [styles.row, done && styles.rowDone, pressed && styles.pressed]}>
              <View style={[styles.box, done && styles.boxDone]}>
                {done && <Text style={styles.check}>✓</Text>}
              </View>
              <Text style={styles.exEmoji}>{ex.emoji}</Text>
              <Text style={[styles.exName, done && styles.exNameDone]} numberOfLines={1}>
                {ex.name}
              </Text>
              <Text style={[styles.exTarget, done && styles.exTargetDone]}>{ex.target}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.footnote}>
        {doneCount === total
          ? '✓ Session complete — nice work.'
          : 'Fat loss comes from the deficit; this firms the area.'}
      </Text>
    </View>
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
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  title: { fontSize: 15, fontWeight: '700', color: AppColors.ink },
  sub: { fontSize: 11.5, color: AppColors.muted, marginTop: 2 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: AppColors.cream,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: AppColors.line,
    padding: 2,
  },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  toggleBtnActive: { backgroundColor: AppColors.green },
  toggleText: { fontSize: 11, fontWeight: '700', color: AppColors.muted },
  toggleTextActive: { color: AppColors.white },
  progressTrack: {
    height: 4,
    backgroundColor: AppColors.line,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: { height: '100%', backgroundColor: AppColors.green, borderRadius: 99 },
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
    backgroundColor: AppColors.paper,
  },
  rowDone: { backgroundColor: AppColors.greenSoft, borderColor: AppColors.greenLine },
  pressed: { transform: [{ scale: 0.995 }] },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: AppColors.greenLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { backgroundColor: AppColors.green, borderColor: AppColors.green },
  check: { color: AppColors.white, fontSize: 12, fontWeight: '700' },
  exEmoji: { fontSize: 15 },
  exName: { flex: 1, fontSize: 14, color: AppColors.ink, fontWeight: '500' },
  exNameDone: { color: AppColors.greenDeep },
  exTarget: { fontSize: 13, fontWeight: '700', color: AppColors.green },
  exTargetDone: { color: AppColors.greenDeep },
  footnote: { fontSize: 11, color: AppColors.muted, marginTop: 10, fontStyle: 'italic' },
});
