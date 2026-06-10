import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';
import { AppColors } from '@/constants/theme';
import type { FoodEntry } from '@/hooks/use-food-log';
import type { AiConfig } from '@/hooks/use-ai-coach';
import { useCalorieAi } from '@/hooks/use-calorie-ai';
import { LateNightBanner } from './late-night-banner';
import { QuickLogChips } from './quick-log-chips';

type ProviderPreset = { baseUrl: string; model: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  entries: FoodEntry[];
  totalCalories: number;
  calorieTarget: number;
  onAdd: (name: string, cal: number) => void;
  onDelete: (id: string) => void;
  aiConfig: AiConfig;
  providerPresets: Record<string, ProviderPreset>;
};

export function FoodLogModal({
  visible,
  onClose,
  entries,
  totalCalories,
  calorieTarget,
  onAdd,
  onDelete,
  aiConfig,
  providerPresets,
}: Props) {
  const [name, setName] = useState('');
  const [calStr, setCalStr] = useState('');
  const { estimate, estimating } = useCalorieAi(aiConfig, providerPresets);

  const isLateNight = new Date().getHours() >= 21;

  async function handleEstimate() {
    if (!name.trim()) return;
    const cal = await estimate(name.trim());
    if (cal != null) setCalStr(String(cal));
  }

  function handleAdd() {
    const cal = parseInt(calStr, 10);
    if (!name.trim() || isNaN(cal) || cal <= 0) return;
    onAdd(name.trim(), cal);
    setName('');
    setCalStr('');
  }

  function handleChipLog(chipName: string, chipCal: number) {
    onAdd(chipName, chipCal);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🍽 Food Log</Text>
          <View style={styles.headerRight}>
            <Text style={styles.calorieCount}>
              {totalCalories} / {calorieTarget} kcal
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          <LateNightBanner visible={isLateNight} />

          {/* Quick chips */}
          <Text style={styles.sectionLabel}>Quick log</Text>
          <QuickLogChips onLog={handleChipLog} />

          {/* Name + estimate row */}
          <Text style={styles.sectionLabel}>Custom food</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              placeholder="Food name…"
              placeholderTextColor={AppColors.muted}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
            <Pressable
              style={[styles.estimateBtn, estimating && styles.estimateBtnDisabled]}
              onPress={handleEstimate}
              disabled={estimating || !name.trim()}>
              {estimating ? (
                <ActivityIndicator size="small" color={AppColors.white} />
              ) : (
                <Text style={styles.estimateTxt}>✨ Estimate</Text>
              )}
            </Pressable>
          </View>

          {/* Calorie input + add */}
          <View style={styles.calRow}>
            <TextInput
              style={styles.calInput}
              placeholder="Calories (kcal)"
              placeholderTextColor={AppColors.muted}
              value={calStr}
              onChangeText={setCalStr}
              keyboardType="numeric"
              returnKeyType="done"
            />
            <Pressable
              style={[styles.addBtn, (!name.trim() || !calStr) && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!name.trim() || !calStr}>
              <Text style={styles.addTxt}>+ Add</Text>
            </Pressable>
          </View>

          {/* Today's log */}
          {entries.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Today's log</Text>
              {entries.map((e) => (
                <View key={e.id} style={styles.entryRow}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryName}>{e.name}</Text>
                    <Text style={styles.entryMeta}>{e.time} · {e.calories} kcal</Text>
                  </View>
                  <Pressable onPress={() => onDelete(e.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteTxt}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: AppColors.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.line,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: AppColors.ink },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  calorieCount: { fontSize: 13, color: AppColors.muted },
  closeBtn: {
    backgroundColor: AppColors.line,
    borderRadius: 99,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: { fontSize: 12, color: AppColors.muted },
  body: { paddingHorizontal: 16, paddingTop: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: AppColors.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  nameRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  nameInput: {
    flex: 1,
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: AppColors.ink,
  },
  estimateBtn: {
    backgroundColor: AppColors.green,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    minWidth: 90,
    alignItems: 'center',
  },
  estimateBtnDisabled: { opacity: 0.5 },
  estimateTxt: { fontSize: 13, color: AppColors.white, fontWeight: '600' },
  calRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  calInput: {
    flex: 1,
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: AppColors.ink,
  },
  addBtn: {
    backgroundColor: AppColors.amber,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addTxt: { fontSize: 14, color: AppColors.white, fontWeight: '700' },
  divider: { height: 1, backgroundColor: AppColors.line, marginVertical: 12 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.line,
  },
  entryLeft: { flex: 1 },
  entryName: { fontSize: 14, color: AppColors.ink, fontWeight: '500' },
  entryMeta: { fontSize: 11, color: AppColors.muted, marginTop: 1 },
  deleteBtn: { padding: 6 },
  deleteTxt: { fontSize: 14, color: AppColors.muted },
});
