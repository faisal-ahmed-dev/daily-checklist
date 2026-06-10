import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';
import { useMeasurements, waistToHeight, wthrCategory } from '@/hooks/use-measurements';
import { useUserProfile } from '@/hooks/use-user-profile';
import { NumberInputModal } from '@/components/number-input-modal';

export function MeasurementsCard() {
  const { latest, waistChange, upsertToday } = useMeasurements();
  const { profile } = useUserProfile();
  const [editing, setEditing] = useState<'waist' | 'hip' | null>(null);

  const waist = latest?.waistCm ?? null;
  const hip = latest?.hipCm ?? null;
  const ratio = waist != null && profile.heightCm ? waistToHeight(waist, profile.heightCm) : null;
  const cat = ratio != null ? wthrCategory(ratio) : null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Body measurements</Text>
        {waistChange != null && (
          <Text style={[styles.change, waistChange <= 0 ? styles.changeDown : styles.changeUp]}>
            {waistChange <= 0 ? '▼' : '▲'} {Math.abs(waistChange)} cm waist
          </Text>
        )}
      </View>

      <View style={styles.row}>
        <Stat label="Waist" value={waist != null ? `${waist} cm` : '—'} onPress={() => setEditing('waist')} />
        <Stat label="Hip" value={hip != null ? `${hip} cm` : '—'} onPress={() => setEditing('hip')} />
      </View>

      {ratio != null && cat ? (
        <View style={styles.ratioRow}>
          <Text style={styles.ratioLabel}>Waist-to-height</Text>
          <Text style={[styles.ratioVal, { color: cat.color }]}>
            {ratio.toFixed(2)} · {cat.label}
          </Text>
        </View>
      ) : (
        <Text style={styles.hint}>Tap waist/hip to log. Aim for waist-to-height under 0.5.</Text>
      )}

      <NumberInputModal
        visible={editing !== null}
        title={editing === 'hip' ? 'Hip (cm)' : 'Waist (cm)'}
        label="centimetres"
        initialValue={(editing === 'hip' ? hip : waist) ?? (editing === 'hip' ? 100 : 90)}
        min={40}
        max={200}
        onCancel={() => setEditing(null)}
        onSave={(v) => {
          upsertToday(editing === 'hip' ? { hipCm: v } : { waistCm: v });
          setEditing(null);
        }}
      />
    </View>
  );
}

function Stat({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.stat, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 13, fontWeight: '700', color: AppColors.ink },
  change: { fontSize: 11, fontWeight: '700' },
  changeDown: { color: AppColors.green },
  changeUp: { color: AppColors.amber },
  row: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: AppColors.cream,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  statValue: { fontSize: 17, fontWeight: '700', color: AppColors.ink },
  statLabel: { fontSize: 11, color: AppColors.muted, marginTop: 2 },
  ratioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.line,
  },
  ratioLabel: { fontSize: 12, color: AppColors.muted },
  ratioVal: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 11, color: AppColors.muted, marginTop: 10 },
});
