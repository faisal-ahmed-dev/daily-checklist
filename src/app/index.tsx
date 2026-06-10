import { useEffect, useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';

import { AppColors, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useDynamicChecklist } from '@/hooks/use-dynamic-checklist';
import { useWater } from '@/hooks/use-water';
import { useDailyLogs } from '@/hooks/use-daily-logs';
import { usePedometer } from '@/hooks/use-pedometer';
import { useStreak } from '@/hooks/use-streak';
import { useWeightLog } from '@/hooks/use-weight-log';
import { useNotifications } from '@/hooks/use-notifications';
import { useAiCoach } from '@/hooks/use-ai-coach';
import { storageGet } from '@/lib/storage';
import { greetingText, prettyDate } from '@/lib/date-utils';
import { scheduleNotifications } from '@/lib/notification-tasks';
import { generateDailyBrief, fetchAiBrief, type CoachContext } from '@/lib/ai-brief';
import { VitalsRow } from '@/components/checklist/vitals-row';
import { StepsCard } from '@/components/checklist/steps-card';
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

  const router = useRouter();

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
  const { steps, goal: stepGoal, isAvailable: isStepTracking, goalReached: stepGoalReached, setManualSteps, setGoal: setStepGoal } = usePedometer();
  const { streak, markComplete } = useStreak();
  const { latestWeight, goalWeight, startWeight, kgToGo } = useWeightLog();
  const { settings: notifSettings } = useNotifications();
  const { config: aiConfig, hasApiKey } = useAiCoach();
  const briefScheduledRef = useRef(false);

  useEffect(() => {
    storageGet<string>(NAME_KEY).then((n) => {
      setUserName(n ?? '');
    });
  }, []);

  // Once per session, refresh the "daily brief" notification with up-to-date
  // (AI-written when a key is set, otherwise rule-based) content.
  useEffect(() => {
    if (briefScheduledRef.current) return;
    if (!loaded || !notifSettings.enabled || !notifSettings.dailyBrief.enabled) return;
    briefScheduledRef.current = true;

    const ctx: CoachContext = {
      userName,
      currentWeight: latestWeight,
      goalWeight: goalWeight ?? 70,
      startWeight: startWeight ?? 89,
      streak,
      doneCount,
      totalCount,
      stepsToday: steps,
      stepGoal,
      waterGlasses: glasses,
      sleepHours: log.sleepHours,
      weeklyCompletionPcts: [],
      weakHabits: [],
      strongHabits: [],
    };

    (async () => {
      let briefText = generateDailyBrief(ctx);
      if (hasApiKey) {
        try {
          briefText = await fetchAiBrief(aiConfig, ctx);
        } catch {
          // keep rule-based fallback
        }
      }
      await scheduleNotifications(notifSettings, briefText).catch(() => {});
    })();
  }, [loaded, notifSettings.enabled, notifSettings.dailyBrief.enabled]);

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
  const weightPct = latestWeight && goalWeight && latestWeight > goalWeight
    ? Math.min(1, Math.max(0, (89 - latestWeight) / (89 - goalWeight)))
    : latestWeight && goalWeight && latestWeight <= goalWeight ? 1 : 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + 80 }]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
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

          {/* Weight Progress Strip */}
          {latestWeight != null && (
            <View style={styles.weightStrip}>
              <View style={styles.weightLeft}>
                <Text style={styles.weightNow}>{latestWeight.toFixed(1)} kg</Text>
                <Text style={styles.weightSub}>current</Text>
              </View>
              <View style={styles.weightBar}>
                <View style={styles.weightTrack}>
                  <View style={[styles.weightFill, { width: `${Math.round(weightPct * 100)}%` }]} />
                </View>
                <Text style={styles.weightKgLeft}>
                  {kgToGo > 0 ? `−${kgToGo.toFixed(1)} kg to go` : '🎉 Goal reached!'}
                </Text>
              </View>
              <View style={styles.weightRight}>
                <Text style={styles.weightGoal}>{goalWeight ?? 70} kg</Text>
                <Text style={styles.weightSub}>goal</Text>
              </View>
            </View>
          )}

          {/* Progress bar */}
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{doneCount}/{totalCount} done</Text>
              <Text style={styles.progressPct}>{progressPctDisplay}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPctDisplay}%` }]} />
            </View>
          </View>

          {/* Steps — auto-tracked card */}
          <StepsCard
            steps={steps}
            goal={stepGoal}
            isStepTracking={isStepTracking}
            goalReached={stepGoalReached}
            onSetSteps={setManualSteps}
            onSetGoal={setStepGoal}
          />

          {/* Quick Vitals Row */}
          <VitalsRow
            waterGlasses={glasses}
            waterGoal={waterGoal}
            sleepHours={log.sleepHours}
            mood={log.mood}
            onAddWater={addGlass}
            onSetWater={setGlassesTo}
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

      {/* Floating AI Chat Button */}
      <Pressable
        style={[styles.fab, { bottom: BottomTabInset + 14 }]}
        onPress={() => router.navigate('/ai' as any)}>
        <Text style={styles.fabEmoji}>🤖</Text>
        <Text style={styles.fabLabel}>AI</Text>
      </Pressable>

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
    paddingHorizontal: 12,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  greeting: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.ink,
  },
  date: { fontSize: 12, color: AppColors.muted, marginTop: 1 },
  streakBadge: {
    backgroundColor: AppColors.amberSoft,
    borderWidth: 1,
    borderColor: AppColors.amberLine,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: { fontSize: 13, fontWeight: '700', color: AppColors.amber },

  // Weight progress strip
  weightStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 10,
  },
  weightLeft: { alignItems: 'center', minWidth: 44 },
  weightRight: { alignItems: 'center', minWidth: 44 },
  weightNow: { fontSize: 13, fontWeight: '700', color: AppColors.ink },
  weightGoal: { fontSize: 13, fontWeight: '700', color: AppColors.green },
  weightSub: { fontSize: 9, color: AppColors.muted, marginTop: 1 },
  weightBar: { flex: 1, alignItems: 'center', gap: 3 },
  weightTrack: {
    height: 5,
    width: '100%',
    backgroundColor: AppColors.line,
    borderRadius: 99,
    overflow: 'hidden',
  },
  weightFill: {
    height: '100%',
    backgroundColor: AppColors.green,
    borderRadius: 99,
  },
  weightKgLeft: { fontSize: 10, color: AppColors.muted },

  progressCard: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: { fontSize: 12, fontWeight: '600', color: AppColors.ink },
  progressPct: { fontSize: 12, fontWeight: '700', color: AppColors.green },
  progressTrack: {
    height: 5,
    backgroundColor: AppColors.line,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.green,
    borderRadius: 99,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: AppColors.green,
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: AppColors.greenDeep,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabEmoji: { fontSize: 22 },
  fabLabel: { fontSize: 9, color: AppColors.white, fontWeight: '700', marginTop: -1 },

  resetBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: AppColors.amberLine,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 6,
    marginBottom: 8,
  },
  resetText: { fontSize: 12, color: AppColors.amber, fontWeight: '500' },
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
    padding: 22,
    paddingBottom: 38,
    gap: 10,
  },
  modalTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.ink,
    marginBottom: 2,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.ink,
    backgroundColor: AppColors.cream,
  },
  modalInputSub: { fontSize: 13 },
  avoidToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: AppColors.amberLine,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.amberSoft,
  },
  checkboxChecked: { backgroundColor: AppColors.amber, borderColor: AppColors.amber },
  checkmark: { color: AppColors.white, fontSize: 11, fontWeight: '700' },
  avoidLabel: { fontSize: 12, color: AppColors.ink },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
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
  addBtn: {
    flex: 2,
    backgroundColor: AppColors.green,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: AppColors.greenLine },
  addBtnText: { fontSize: 13, color: AppColors.white, fontWeight: '700' },
});
