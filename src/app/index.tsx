import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

import { AppColors, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useDynamicChecklist } from '@/hooks/use-dynamic-checklist';
import { useWater } from '@/hooks/use-water';
import { useDailyLogs } from '@/hooks/use-daily-logs';
import { usePedometer } from '@/hooks/use-pedometer';
import { useStreak } from '@/hooks/use-streak';
import { storageGet } from '@/lib/storage';
import { greetingText, prettyDate } from '@/lib/date-utils';
import { VitalsRow } from '@/components/checklist/vitals-row';
import { AccordionSection } from '@/components/checklist/checklist-section';
import type { MoodLevel } from '@/hooks/use-daily-logs';

const NAME_KEY = '@user/name';

function getActiveSection(sections: { key: string; start: number; end: number }[]): string | null {
  const hour = new Date().getHours();
  for (const s of sections) {
    if (s.start >= 0 && hour >= s.start && hour < s.end) return s.key;
  }
  return null;
}

type AddItemState = {
  visible: boolean;
  sectionKey: string;
  main: string;
  sub: string;
  avoid: boolean;
};

export default function TodayScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const [userName, setUserName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [addModal, setAddModal] = useState<AddItemState>({
    visible: false, sectionKey: '', main: '', sub: '', avoid: false,
  });

  const {
    sections,
    completed,
    toggle,
    reset,
    addItem,
    deleteItem,
    doneCount,
    totalCount,
    progressPct,
    allDone,
    loaded,
  } = useDynamicChecklist();

  const { glasses, goal: waterGoal, addGlass, setGlassesTo } = useWater();
  const { log, setSleep, setMood } = useDailyLogs();
  const { steps, goal: stepGoal, setManualSteps } = usePedometer();
  const { streak, markComplete } = useStreak();

  useEffect(() => {
    storageGet<string>(NAME_KEY).then((n) => {
      setUserName(n ?? '');
    });
  }, []);

  // Auto-expand active section on load
  useEffect(() => {
    if (!loaded) return;
    const activeKey = getActiveSection(sections);
    if (activeKey) {
      setExpandedSections(new Set([activeKey]));
    } else if (sections.length > 0) {
      setExpandedSections(new Set([sections[0].key]));
    }
  }, [loaded]);

  // Mark streak complete when all done
  useEffect(() => {
    if (allDone) markComplete();
  }, [allDone]);

  if (!fontsLoaded) return null;

  const activeKey = getActiveSection(sections);

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openAddModal(sectionKey: string) {
    setAddModal({ visible: true, sectionKey, main: '', sub: '', avoid: false });
  }

  function closeAddModal() {
    setAddModal((prev) => ({ ...prev, visible: false }));
  }

  async function confirmAddItem() {
    if (!addModal.main.trim()) return;
    await addItem(addModal.sectionKey, addModal.main.trim(), addModal.sub.trim(), addModal.avoid);
    closeAddModal();
  }

  function handleResetChecklist() {
    Alert.alert('Reset today?', 'This will clear all checked items for today.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: reset },
    ]);
  }

  const progressPctDisplay = Math.round(progressPct * 100);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + 80 }]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {greetingText()}{userName ? `, ${userName}` : ''}
              </Text>
              <Text style={styles.date}>{prettyDate()}</Text>
            </View>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak}</Text>
              </View>
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>
                {doneCount}/{totalCount} done
              </Text>
              <Text style={styles.progressPct}>{progressPctDisplay}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${progressPctDisplay}%` }]}
              />
            </View>
          </View>

          {/* Quick Vitals Row */}
          <VitalsRow
            waterGlasses={glasses}
            waterGoal={waterGoal}
            steps={steps}
            stepGoal={stepGoal}
            sleepHours={log.sleepHours}
            mood={log.mood}
            onAddWater={addGlass}
            onSetWater={setGlassesTo}
            onSetSteps={setManualSteps}
            onSetSleep={setSleep}
            onSetMood={(m: MoodLevel) => setMood(m)}
          />

          {/* Accordion Checklist */}
          {sections.map((section) => (
            <AccordionSection
              key={section.key}
              section={section}
              completed={completed}
              isActive={section.key === activeKey}
              isExpanded={expandedSections.has(section.key)}
              onToggleExpand={() => toggleSection(section.key)}
              onToggleItem={toggle}
              onAddItem={() => openAddModal(section.key)}
              onDeleteItem={(id, isBuiltIn) => {
                Alert.alert(
                  'Remove item?',
                  isBuiltIn ? 'This built-in item will be hidden.' : 'This custom item will be deleted.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => deleteItem(id, isBuiltIn) },
                  ]
                );
              }}
            />
          ))}

          {/* Reset button */}
          <Pressable
            onPress={handleResetChecklist}
            style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}>
            <Text style={styles.resetText}>Reset today's checklist</Text>
          </Pressable>
        </SafeAreaView>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={addModal.visible}
        transparent
        animationType="slide"
        onRequestClose={closeAddModal}>
        <Pressable style={styles.modalOverlay} onPress={closeAddModal}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add Item</Text>

            <TextInput
              style={styles.modalInput}
              value={addModal.main}
              onChangeText={(t) => setAddModal((p) => ({ ...p, main: t }))}
              placeholder="What to do..."
              placeholderTextColor={AppColors.muted}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputSub]}
              value={addModal.sub}
              onChangeText={(t) => setAddModal((p) => ({ ...p, sub: t }))}
              placeholder="Note / reminder (optional)"
              placeholderTextColor={AppColors.muted}
            />

            <Pressable
              style={styles.avoidToggle}
              onPress={() => setAddModal((p) => ({ ...p, avoid: !p.avoid }))}>
              <View style={[styles.checkbox, addModal.avoid && styles.checkboxChecked]}>
                {addModal.avoid && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.avoidLabel}>Mark as "RESIST" (avoid item)</Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={closeAddModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.addBtn, !addModal.main.trim() && styles.addBtnDisabled]}
                onPress={confirmAddItem}
                disabled={!addModal.main.trim()}>
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 14,
  },
  greeting: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    fontWeight: '600',
    color: AppColors.ink,
  },
  date: { fontSize: 13, color: AppColors.muted, marginTop: 2 },
  streakBadge: {
    backgroundColor: AppColors.amberSoft,
    borderWidth: 1,
    borderColor: AppColors.amberLine,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  streakText: { fontSize: 14, fontWeight: '700', color: AppColors.amber },

  progressCard: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 13, fontWeight: '600', color: AppColors.ink },
  progressPct: { fontSize: 13, fontWeight: '700', color: AppColors.green },
  progressTrack: {
    height: 6,
    backgroundColor: AppColors.line,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.green,
    borderRadius: 99,
  },

  resetBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: AppColors.amberLine,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  resetText: { fontSize: 13, color: AppColors.amber, fontWeight: '500' },
  pressed: { opacity: 0.7 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: AppColors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.ink,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: AppColors.ink,
    backgroundColor: AppColors.cream,
  },
  modalInputSub: { fontSize: 13 },
  avoidToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AppColors.amberLine,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.amberSoft,
  },
  checkboxChecked: { backgroundColor: AppColors.amber, borderColor: AppColors.amber },
  checkmark: { color: AppColors.white, fontSize: 12, fontWeight: '700' },
  avoidLabel: { fontSize: 13, color: AppColors.ink },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: AppColors.cream,
  },
  cancelText: { fontSize: 14, color: AppColors.muted, fontWeight: '500' },
  addBtn: {
    flex: 2,
    backgroundColor: AppColors.green,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: AppColors.greenLine },
  addBtnText: { fontSize: 14, color: AppColors.white, fontWeight: '700' },
});
