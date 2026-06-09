import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

import { AppColors, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useWeightLog } from '@/hooks/use-weight-log';
import { useUserProfile } from '@/hooks/use-user-profile';
import { calcBMI, bmiCategory, calcCalorieTarget, calcProteinTarget } from '@/lib/bmr-calculator';
import { todayKey, shortDate } from '@/lib/date-utils';
import { WeightChart } from '@/components/weight/weight-chart';

export default function WeightLogScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const {
    entries,
    addEntry,
    deleteEntry,
    latestWeight,
    bmi,
    kgLost,
    kgToGo,
    progressPct,
    goalDate,
    weeklyChange,
    startWeight,
    goalWeight,
    heightCm,
    updateHeight,
  } = useWeightLog();

  const { profile, updateProfile } = useUserProfile();

  const [weightInput, setWeightInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [heightInput, setHeightInput] = useState(String(heightCm));

  if (!fontsLoaded) return null;

  const bmiInfo = latestWeight ? bmiCategory(calcBMI(latestWeight, heightCm)) : null;
  const calTarget = calcCalorieTarget({ ...profile, weightKg: latestWeight ?? profile.weightKg });
  const proteinTarget = calcProteinTarget(latestWeight ?? profile.weightKg);

  async function handleAddEntry() {
    const kg = parseFloat(weightInput);
    if (isNaN(kg) || kg < 30 || kg > 300) {
      Alert.alert('Invalid weight', 'Please enter a weight between 30 and 300 kg.');
      return;
    }
    await addEntry(kg, todayKey(), noteInput.trim() || undefined);
    setWeightInput('');
    setNoteInput('');
  }

  function handleDeleteEntry(id: string) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(id) },
    ]);
  }

  const goalDateStr = goalDate
    ? goalDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.four }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={['top']}>
          <View style={styles.head}>
            <Text style={styles.title}>Weight Log</Text>
            <Text style={styles.subtitle}>89 → 70 kg</Text>
          </View>

          {/* Goal Progress */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>CURRENT WEIGHT</Text>
            <Text style={styles.bigWeight}>
              {latestWeight ? latestWeight.toFixed(1) : '—'}{' '}
              <Text style={styles.kgUnit}>kg</Text>
            </Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressInfo}>
                {kgLost.toFixed(1)} kg lost · {kgToGo.toFixed(1)} kg to go
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` }]}
              />
            </View>
            <View style={styles.progressEnds}>
              <Text style={styles.progressEndText}>{startWeight} kg</Text>
              <Text style={styles.progressEndText}>{goalWeight} kg</Text>
            </View>

            {goalDateStr && (
              <View style={styles.predictionBanner}>
                <Text style={styles.predictionText}>
                  At your current rate, you'll reach {goalWeight} kg by {goalDateStr}
                </Text>
              </View>
            )}

            {weeklyChange !== null && (
              <Text
                style={[
                  styles.weeklyChange,
                  weeklyChange < 0 ? styles.weeklyLoss : styles.weeklyGain,
                ]}>
                {weeklyChange < 0 ? '↓' : '↑'} {Math.abs(weeklyChange)} kg this week
              </Text>
            )}
          </View>

          {/* BMI Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>BMI</Text>
            <View style={styles.bmiRow}>
              <Text style={styles.bmiValue}>{bmi ?? '—'}</Text>
              {bmiInfo && (
                <View style={[styles.bmiCategory, { backgroundColor: bmiInfo.color + '22' }]}>
                  <Text style={[styles.bmiCategoryText, { color: bmiInfo.color }]}>
                    {bmiInfo.label}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.bmiTarget}>
              Target BMI at 70 kg:{' '}
              <Text style={styles.bmiTargetValue}>
                {calcBMI(70, heightCm).toFixed(1)} (Normal)
              </Text>
            </Text>
            <View style={styles.heightRow}>
              <Text style={styles.heightLabel}>Your height:</Text>
              <TextInput
                style={styles.heightInput}
                value={heightInput}
                onChangeText={setHeightInput}
                onEndEditing={() => {
                  const h = parseFloat(heightInput);
                  if (h >= 100 && h <= 250) updateHeight(h);
                }}
                keyboardType="numeric"
                maxLength={5}
              />
              <Text style={styles.heightUnit}>cm</Text>
            </View>
          </View>

          {/* Calorie & Protein */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DAILY TARGETS</Text>
            <View style={styles.targetGrid}>
              <View style={styles.targetItem}>
                <Text style={styles.targetValue}>{calTarget}</Text>
                <Text style={styles.targetLabel}>kcal/day{'\n'}(0.5 kg/week loss)</Text>
              </View>
              <View style={styles.targetDivider} />
              <View style={styles.targetItem}>
                <Text style={styles.targetValue}>{proteinTarget}g</Text>
                <Text style={styles.targetLabel}>protein/day{'\n'}(2g per kg)</Text>
              </View>
            </View>
          </View>

          {/* Chart */}
          <WeightChart entries={entries} goalWeight={goalWeight} />

          {/* Add Entry */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>LOG TODAY'S WEIGHT</Text>
            <View style={styles.entryRow}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="e.g. 86.5"
                placeholderTextColor={AppColors.muted}
                keyboardType="decimal-pad"
                maxLength={6}
              />
              <Text style={styles.kgSuffix}>kg</Text>
            </View>
            <TextInput
              style={styles.noteInput}
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="Optional note (e.g. after gym)"
              placeholderTextColor={AppColors.muted}
              maxLength={100}
            />
            <Pressable
              onPress={handleAddEntry}
              style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}>
              <Text style={styles.addBtnText}>Add Entry</Text>
            </Pressable>
          </View>

          {/* History */}
          {entries.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>HISTORY</Text>
              {entries.map((entry, i) => {
                const prev = entries[i + 1];
                const delta = prev ? +(entry.kg - prev.kg).toFixed(1) : null;
                return (
                  <View
                    key={entry.id}
                    style={[styles.historyRow, i < entries.length - 1 && styles.historyRowBorder]}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyDate}>{shortDate(entry.date)}</Text>
                      {entry.note ? (
                        <Text style={styles.historyNote}>{entry.note}</Text>
                      ) : null}
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyKg}>{entry.kg.toFixed(1)} kg</Text>
                      {delta !== null && (
                        <Text
                          style={[
                            styles.historyDelta,
                            delta < 0 ? styles.deltaGood : styles.deltaBad,
                          ]}>
                          {delta < 0 ? '↓' : '+'}{Math.abs(delta)}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteEntry(entry.id)}
                      style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.cream },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 14,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  head: { marginBottom: 16, marginTop: 4 },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    fontWeight: '600',
    color: AppColors.ink,
  },
  subtitle: { fontSize: 14, color: AppColors.muted, marginTop: 2 },

  card: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: AppColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
    marginBottom: 8,
  },
  bigWeight: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 42,
    fontWeight: '600',
    color: AppColors.ink,
    lineHeight: 50,
  },
  kgUnit: { fontSize: 22, color: AppColors.muted },

  progressRow: { marginBottom: 8 },
  progressInfo: { fontSize: 13, color: AppColors.muted },
  progressTrack: {
    height: 10,
    backgroundColor: AppColors.greenSoft,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: { height: '100%', backgroundColor: AppColors.green, borderRadius: 99 },
  progressEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  progressEndText: { fontSize: 11, color: AppColors.muted },

  predictionBanner: {
    backgroundColor: AppColors.greenSoft,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  predictionText: { fontSize: 13, color: AppColors.greenDeep, fontWeight: '500' },

  weeklyChange: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  weeklyLoss: { color: AppColors.green },
  weeklyGain: { color: AppColors.amber },

  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  bmiValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 32,
    fontWeight: '600',
    color: AppColors.ink,
  },
  bmiCategory: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  bmiCategoryText: { fontSize: 13, fontWeight: '600' },
  bmiTarget: { fontSize: 12.5, color: AppColors.muted },
  bmiTargetValue: { color: AppColors.greenDeep, fontWeight: '500' },
  heightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  heightLabel: { fontSize: 13, color: AppColors.muted },
  heightInput: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    color: AppColors.ink,
    backgroundColor: AppColors.cream,
    width: 60,
    textAlign: 'center',
  },
  heightUnit: { fontSize: 13, color: AppColors.muted },

  targetGrid: { flexDirection: 'row', alignItems: 'center' },
  targetItem: { flex: 1, alignItems: 'center' },
  targetDivider: { width: 1, height: 40, backgroundColor: AppColors.line, marginHorizontal: 8 },
  targetValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 26,
    fontWeight: '600',
    color: AppColors.ink,
  },
  targetLabel: { fontSize: 11, color: AppColors.muted, textAlign: 'center', lineHeight: 15 },

  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: AppColors.ink,
    backgroundColor: AppColors.cream,
    fontFamily: 'Fraunces_600SemiBold',
  },
  kgSuffix: {
    fontSize: 16,
    color: AppColors.muted,
    fontWeight: '500',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.ink,
    backgroundColor: AppColors.cream,
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: AppColors.green,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addBtnPressed: { opacity: 0.85 },
  addBtnText: { color: AppColors.white, fontSize: 15, fontWeight: '600' },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: AppColors.line },
  historyLeft: { flex: 1 },
  historyDate: { fontSize: 14, fontWeight: '500', color: AppColors.ink },
  historyNote: { fontSize: 12, color: AppColors.muted, marginTop: 2 },
  historyRight: { alignItems: 'flex-end', marginRight: 10 },
  historyKg: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.ink,
  },
  historyDelta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  deltaGood: { color: AppColors.green },
  deltaBad: { color: AppColors.amber },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 14, color: AppColors.muted },
});
