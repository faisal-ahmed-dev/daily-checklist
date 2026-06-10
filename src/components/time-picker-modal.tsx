import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';

type Props = {
  visible: boolean;
  initialHour: number; // 24h
  initialMinute: number;
  title?: string;
  onCancel: () => void;
  onSave: (hour: number, minute: number) => void;
};

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,..,55

/** Format a 24h time as "6:00 AM". */
export function formatTime12h(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

function to24h(h12: number, minute: number, period: 'AM' | 'PM'): { hour: number; minute: number } {
  let hour = h12 % 12;
  if (period === 'PM') hour += 12;
  return { hour, minute };
}

export function TimePickerModal({
  visible,
  initialHour,
  initialMinute,
  title = 'Set time',
  onCancel,
  onSave,
}: Props) {
  const [h12, setH12] = useState(1);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (!visible) return;
    setPeriod(initialHour >= 12 ? 'PM' : 'AM');
    setH12(initialHour % 12 === 0 ? 12 : initialHour % 12);
    // snap minute to nearest 5
    setMinute(Math.round(initialMinute / 5) * 5 % 60);
  }, [visible, initialHour, initialMinute]);

  function handleSave() {
    const { hour, minute: m } = to24h(h12, minute, period);
    onSave(hour, m);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.preview}>{formatTime12h(to24h(h12, minute, period).hour, minute)}</Text>

          <View style={styles.columns}>
            {/* Hours */}
            <View style={styles.col}>
              <Text style={styles.colLabel}>Hour</Text>
              <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                {HOURS_12.map((h) => (
                  <Pressable
                    key={h}
                    style={[styles.cell, h12 === h && styles.cellActive]}
                    onPress={() => setH12(h)}>
                    <Text style={[styles.cellText, h12 === h && styles.cellTextActive]}>{h}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Minutes */}
            <View style={styles.col}>
              <Text style={styles.colLabel}>Minute</Text>
              <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                {MINUTES.map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.cell, minute === m && styles.cellActive]}
                    onPress={() => setMinute(m)}>
                    <Text style={[styles.cellText, minute === m && styles.cellTextActive]}>
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* AM/PM */}
            <View style={styles.col}>
              <Text style={styles.colLabel}>{' '}</Text>
              <View style={styles.periodWrap}>
                {(['AM', 'PM'] as const).map((p) => (
                  <Pressable
                    key={p}
                    style={[styles.period, period === p && styles.periodActive]}
                    onPress={() => setPeriod(p)}>
                    <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: AppColors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 38,
  },
  title: { fontSize: 18, fontWeight: '700', color: AppColors.ink },
  preview: { fontSize: 26, fontWeight: '700', color: AppColors.green, marginTop: 4, marginBottom: 12 },
  columns: { flexDirection: 'row', gap: 12, height: 180 },
  col: { flex: 1 },
  colLabel: { fontSize: 11, color: AppColors.muted, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  colScroll: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    backgroundColor: AppColors.cream,
  },
  cell: { paddingVertical: 11, alignItems: 'center' },
  cellActive: { backgroundColor: AppColors.greenLine },
  cellText: { fontSize: 16, color: AppColors.ink },
  cellTextActive: { fontWeight: '700', color: AppColors.greenDeep },
  periodWrap: { gap: 8 },
  period: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: AppColors.cream,
  },
  periodActive: { backgroundColor: AppColors.green, borderColor: AppColors.green },
  periodText: { fontSize: 15, fontWeight: '700', color: AppColors.muted },
  periodTextActive: { color: AppColors.white },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: AppColors.cream,
  },
  cancelText: { fontSize: 13, color: AppColors.muted, fontWeight: '500' },
  saveBtn: {
    flex: 2,
    backgroundColor: AppColors.green,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveText: { fontSize: 13, color: AppColors.white, fontWeight: '700' },
});
