import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

import { AppColors, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useNotifications } from '@/hooks/use-notifications';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useWeightLog } from '@/hooks/use-weight-log';
import { useDynamicChecklist } from '@/hooks/use-dynamic-checklist';
import { useAiCoach } from '@/hooks/use-ai-coach';
import { useAiContext } from '@/hooks/use-ai-context';
import { useFoodLog } from '@/hooks/use-food-log';
import { NOTIFICATION_SLOTS } from '@/lib/notification-tasks';
import { useRoutine } from '@/hooks/use-routine';
import { ROUTINE_FIELDS, type UserRoutine } from '@/lib/user-routine';
import { TimePickerModal, formatTime12h } from '@/components/time-picker-modal';
import type { AiProvider } from '@/hooks/use-ai-coach';
import type { ContextCategory } from '@/hooks/use-ai-context';
import { CATEGORY_LABELS, CATEGORY_PLACEHOLDERS } from '@/hooks/use-ai-context';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const {
    settings,
    requestAndEnable,
    disable,
    toggleSlot,
    toggleWeighIn,
    setSlotTime,
    addCustomReminder,
    updateCustomReminder,
    deleteCustomReminder,
    toggleDailyBrief,
    setBriefTime,
  } = useNotifications();
  const { profile, updateProfile } = useUserProfile();
  const { routine, updateRoutine } = useRoutine();
  const { entries } = useWeightLog();
  const { reset: resetChecklist } = useDynamicChecklist();
  const { config: aiConfig, updateConfig: updateAiConfig, providerPresets } = useAiCoach();
  const { fields: aiContextFields, addField, deleteField } = useAiContext();
  const { entries: foodEntries } = useFoodLog();
  const router = useRouter();

  const [age, setAge] = useState(String(profile.ageYears));
  const [addContextModal, setAddContextModal] = useState<{ visible: boolean; category: ContextCategory; label: string; value: string }>({
    visible: false, category: 'lifestyle', label: '', value: '',
  });
  const [apiKeyInput, setApiKeyInput] = useState(aiConfig.apiKey);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState(aiConfig.baseUrl);
  const [customModel, setCustomModel] = useState(aiConfig.model);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // Time-picker target: which reminder's time we're editing.
  type TimeTarget =
    | { kind: 'slot'; id: string }
    | { kind: 'brief' }
    | { kind: 'custom-new' }
    | { kind: 'custom-edit'; id: string }
    | { kind: 'routine'; field: keyof UserRoutine };
  const [timeTarget, setTimeTarget] = useState<TimeTarget | null>(null);
  const [timeInit, setTimeInit] = useState<{ hour: number; minute: number }>({ hour: 8, minute: 0 });
  const [customModal, setCustomModal] = useState<{ visible: boolean; label: string; hour: number; minute: number }>({
    visible: false, label: '', hour: 9, minute: 0,
  });

  function openTimePicker(target: TimeTarget, hour: number, minute: number) {
    setTimeTarget(target);
    setTimeInit({ hour, minute });
  }

  function handleTimeSave(hour: number, minute: number) {
    const target = timeTarget;
    setTimeTarget(null);
    if (!target) return;
    if (target.kind === 'slot') setSlotTime(target.id, hour, minute);
    else if (target.kind === 'brief') setBriefTime(hour, minute);
    else if (target.kind === 'custom-edit') updateCustomReminder(target.id, { hour, minute });
    else if (target.kind === 'custom-new') setCustomModal((p) => ({ ...p, hour, minute }));
    else if (target.kind === 'routine') updateRoutine({ [target.field]: { hour, minute } });
  }

  function slotTime(id: string, h: number, m: number) {
    return settings.times[id] ?? { hour: h, minute: m };
  }

  // Sync local AI input state when config loads from storage
  useEffect(() => {
    setApiKeyInput(aiConfig.apiKey);
    setCustomBaseUrl(aiConfig.baseUrl);
    setCustomModel(aiConfig.model);
  }, [aiConfig.apiKey]);

  if (!fontsLoaded) return null;

  async function handleNotificationToggle() {
    if (settings.enabled) {
      await disable();
    } else {
      const granted = await requestAndEnable();
      if (!granted) {
        Alert.alert(
          'Permission denied',
          'Please enable notifications in your phone settings to receive reminders.'
        );
      }
    }
  }

  async function exportWeightCSV() {
    if (entries.length === 0) {
      Alert.alert('No data', 'Log some weight entries first.');
      return;
    }
    const header = 'date,weight_kg,note\n';
    const rows = entries
      .map((e) => `${e.date},${e.kg},${e.note ?? ''}`)
      .join('\n');
    const csv = header + rows;
    const path = (FileSystem.cacheDirectory ?? '') + 'weight-log.csv';
    await FileSystem.writeAsStringAsync(path, csv);
    await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Weight Log' });
  }

  function handleResetChecklist() {
    Alert.alert('Reset today?', 'This will clear all checked items for today.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetChecklist },
    ]);
  }

  function saveApiKey() {
    updateAiConfig({ apiKey: apiKeyInput });
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  }

  async function handleAiSuggest() {
    if (!aiConfig.apiKey) {
      Alert.alert('No API key', 'Add your AI Coach API key first.');
      return;
    }
    setSuggestLoading(true);
    try {
      const recentFoods = foodEntries.slice(0, 8).map((f) => f.name).join(', ') || 'not logged yet';
      const existing = aiContextFields.map((f) => f.value).join('; ') || 'none';
      const preset = providerPresets[aiConfig.provider];
      const baseUrl = aiConfig.provider === 'custom' ? aiConfig.baseUrl : preset.baseUrl;
      const model = aiConfig.model || preset.model;

      const prompt = `Profile: age ${profile.ageYears}, ${profile.gender}, ${profile.activityLevel} activity.
Recent foods eaten: ${recentFoods}.
Existing context: ${existing}.

Generate 4 short health context facts (5-10 words each) that would help an AI health coach give better personalised advice. Do NOT repeat facts already in existing context.
Return ONLY a JSON array: ["fact1","fact2","fact3","fact4"]`;

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiConfig.apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You extract health context. Return only valid JSON arrays, no markdown.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? '[]';
      const match = raw.match(/\[[\s\S]*\]/);
      const parsed: unknown = JSON.parse(match?.[0] ?? '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSuggestions(parsed.filter((s): s is string => typeof s === 'string'));
        setShowSuggestModal(true);
      } else {
        Alert.alert('No suggestions', 'Try again after logging some food.');
      }
    } catch {
      Alert.alert('Error', 'Could not get suggestions. Check your API key and connection.');
    } finally {
      setSuggestLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.four }]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View style={styles.head}>
            <Text style={styles.title}>Settings</Text>
          </View>

          {/* Notifications Master Toggle */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notifications</Text>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Enable reminders</Text>
                <Text style={styles.rowSub}>
                  {settings.enabled
                    ? 'Reminders are active — fires even when app is closed'
                    : 'Get nudged at key times throughout the day'}
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: AppColors.line, true: AppColors.green }}
                thumbColor={AppColors.white}
              />
            </View>

            {settings.enabled && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>Individual reminders</Text>
                <Text style={[styles.rowSub, { marginBottom: 6 }]}>
                  Tap a time to change when each reminder fires.
                </Text>
                {NOTIFICATION_SLOTS.filter((s) => s.id !== 'weigh-in').map((slot) => {
                  const t = slotTime(slot.id, slot.hour, slot.minute);
                  const name = slot.label.includes('—') ? slot.label.split('—').pop()!.trim() : slot.label;
                  return (
                    <View key={slot.id} style={styles.slotRow}>
                      <Text style={styles.slotLabel} numberOfLines={1}>{name}</Text>
                      <Pressable
                        style={({ pressed }) => [styles.timeChip, pressed && styles.actionBtnPressed]}
                        onPress={() => openTimePicker({ kind: 'slot', id: slot.id }, t.hour, t.minute)}>
                        <Text style={styles.timeChipText}>{formatTime12h(t.hour, t.minute)}</Text>
                      </Pressable>
                      <Switch
                        value={settings.enabledIds.includes(slot.id)}
                        onValueChange={() => toggleSlot(slot.id)}
                        trackColor={{ false: AppColors.line, true: AppColors.green }}
                        thumbColor={AppColors.white}
                        style={styles.slotSwitch}
                      />
                    </View>
                  );
                })}

                {/* Weekly weigh-in */}
                <View style={styles.slotRow}>
                  <Text style={styles.slotLabel}>Weekly weigh-in (Mondays)</Text>
                  <Pressable
                    style={({ pressed }) => [styles.timeChip, pressed && styles.actionBtnPressed]}
                    onPress={() => {
                      const t = slotTime('weigh-in', 7, 0);
                      openTimePicker({ kind: 'slot', id: 'weigh-in' }, t.hour, t.minute);
                    }}>
                    <Text style={styles.timeChipText}>
                      {formatTime12h(slotTime('weigh-in', 7, 0).hour, slotTime('weigh-in', 7, 0).minute)}
                    </Text>
                  </Pressable>
                  <Switch
                    value={settings.weeklyWeighIn}
                    onValueChange={toggleWeighIn}
                    trackColor={{ false: AppColors.line, true: AppColors.green }}
                    thumbColor={AppColors.white}
                    style={styles.slotSwitch}
                  />
                </View>

                {/* Daily AI brief */}
                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>Daily check-in</Text>
                    <Text style={styles.rowSub}>
                      A personalized summary of how your day is going + what to do next.
                      Uses your AI Coach when a key is set, otherwise a smart rule-based recap.
                    </Text>
                  </View>
                  <Switch
                    value={settings.dailyBrief.enabled}
                    onValueChange={toggleDailyBrief}
                    trackColor={{ false: AppColors.line, true: AppColors.green }}
                    thumbColor={AppColors.white}
                  />
                </View>
                {settings.dailyBrief.enabled && (
                  <View style={[styles.slotRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.slotLabel}>Check-in time</Text>
                    <Pressable
                      style={({ pressed }) => [styles.timeChip, pressed && styles.actionBtnPressed]}
                      onPress={() =>
                        openTimePicker({ kind: 'brief' }, settings.dailyBrief.hour, settings.dailyBrief.minute)
                      }>
                      <Text style={styles.timeChipText}>
                        {formatTime12h(settings.dailyBrief.hour, settings.dailyBrief.minute)}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Custom reminders */}
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>My reminders</Text>
                {settings.custom.length === 0 && (
                  <Text style={[styles.rowSub, { marginBottom: 6 }]}>
                    Add your own reminders — anything you want nudged daily.
                  </Text>
                )}
                {settings.custom.map((r) => (
                  <View key={r.id} style={styles.slotRow}>
                    <Text style={styles.slotLabel} numberOfLines={1}>{r.label}</Text>
                    <Pressable
                      style={({ pressed }) => [styles.timeChip, pressed && styles.actionBtnPressed]}
                      onPress={() => openTimePicker({ kind: 'custom-edit', id: r.id }, r.hour, r.minute)}>
                      <Text style={styles.timeChipText}>{formatTime12h(r.hour, r.minute)}</Text>
                    </Pressable>
                    <Switch
                      value={r.enabled}
                      onValueChange={() => updateCustomReminder(r.id, { enabled: !r.enabled })}
                      trackColor={{ false: AppColors.line, true: AppColors.green }}
                      thumbColor={AppColors.white}
                      style={styles.slotSwitch}
                    />
                    <Pressable onPress={() => deleteCustomReminder(r.id)} style={styles.deleteBtn} hitSlop={6}>
                      <Text style={styles.deleteText}>×</Text>
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  style={({ pressed }) => [styles.addContextBtn, pressed && styles.actionBtnPressed]}
                  onPress={() => setCustomModal({ visible: true, label: '', hour: 9, minute: 0 })}>
                  <Text style={styles.addContextText}>+ Add reminder</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* My Routine */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>My Routine</Text>
            <Text style={[styles.rowSub, { marginBottom: 10 }]}>
              Your reminders fire around these times. Update them whenever your schedule changes.
            </Text>
            {ROUTINE_FIELDS.map(({ key, label, emoji }) => (
              <View key={key} style={styles.slotRow}>
                <Text style={styles.slotLabel} numberOfLines={1}>{emoji}  {label}</Text>
                <Pressable
                  style={({ pressed }) => [styles.timeChip, { marginRight: 0 }, pressed && styles.actionBtnPressed]}
                  onPress={() =>
                    openTimePicker({ kind: 'routine', field: key }, routine[key].hour, routine[key].minute)
                  }>
                  <Text style={styles.timeChipText}>
                    {formatTime12h(routine[key].hour, routine[key].minute)}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Personal Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Info</Text>
            <Text style={[styles.rowSub, { marginBottom: 12 }]}>
              Used to calculate BMR and daily calorie targets.
            </Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoField}>
                <Text style={styles.fieldLabel}>Age</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={age}
                  onChangeText={setAge}
                  onEndEditing={() => {
                    const a = parseInt(age, 10);
                    if (a >= 10 && a <= 120) updateProfile({ ageYears: a });
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              <View style={styles.infoField}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.segmented}>
                  {(['male', 'female'] as const).map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => updateProfile({ gender: g })}
                      style={[
                        styles.segment,
                        profile.gender === g && styles.segmentActive,
                      ]}>
                      <Text
                        style={[
                          styles.segmentText,
                          profile.gender === g && styles.segmentTextActive,
                        ]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.infoField}>
                <Text style={styles.fieldLabel}>Activity</Text>
                <View style={styles.activityOptions}>
                  {(
                    [
                      ['sedentary', 'Desk job'],
                      ['light', 'Light activity'],
                      ['moderate', 'Moderate'],
                      ['active', 'Very active'],
                    ] as const
                  ).map(([val, label]) => (
                    <Pressable
                      key={val}
                      onPress={() => updateProfile({ activityLevel: val })}
                      style={[
                        styles.activityOption,
                        profile.activityLevel === val && styles.activityOptionActive,
                      ]}>
                      <Text
                        style={[
                          styles.activityOptionText,
                          profile.activityLevel === val && styles.activityOptionTextActive,
                        ]}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Data */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Data</Text>
            <Pressable
              onPress={() => router.push('/progress-photos' as any)}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}>
              <Text style={styles.actionBtnText}>📷 Progress Photos</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              onPress={() => router.push('/achievements' as any)}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}>
              <Text style={styles.actionBtnText}>🏆 Achievements</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              onPress={() => router.push('/my-data' as any)}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}>
              <Text style={styles.actionBtnText}>View All My Data (JSON)</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              onPress={exportWeightCSV}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}>
              <Text style={styles.actionBtnText}>Export Weight Log as CSV</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              onPress={handleResetChecklist}
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && styles.actionBtnPressed]}>
              <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>
                Reset Today's Checklist
              </Text>
            </Pressable>
          </View>

          {/* AI Context Fields */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI Context</Text>
            <Text style={[styles.rowSub, { marginBottom: 10 }]}>
              Tell the AI about yourself for personalised advice.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.suggestBtn, pressed && { opacity: 0.75 }, suggestLoading && styles.addBtnDisabled]}
              disabled={suggestLoading}
              onPress={handleAiSuggest}>
              {suggestLoading
                ? <ActivityIndicator size="small" color={AppColors.white} />
                : <Text style={styles.suggestBtnText}>✨ AI Suggest from my data</Text>
              }
            </Pressable>
            <View style={styles.divider} />

            {(Object.keys(CATEGORY_LABELS) as ContextCategory[]).map((cat) => {
              const catFields = aiContextFields.filter((f) => f.category === cat);
              return (
                <View key={cat} style={styles.contextCategory}>
                  <Text style={styles.sectionLabel}>{CATEGORY_LABELS[cat]}</Text>
                  {catFields.map((f) => (
                    <View key={f.id} style={styles.contextField}>
                      <Text style={styles.contextValue} numberOfLines={2}>
                        {cat === 'custom' ? `${f.label}: ${f.value}` : f.value}
                      </Text>
                      <Pressable onPress={() => deleteField(f.id)} style={styles.deleteBtn}>
                        <Text style={styles.deleteText}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable
                    style={({ pressed }) => [styles.addContextBtn, pressed && styles.actionBtnPressed]}
                    onPress={() =>
                      setAddContextModal({ visible: true, category: cat, label: '', value: '' })
                    }>
                    <Text style={styles.addContextText}>+ Add {CATEGORY_LABELS[cat].split(' ')[0].toLowerCase()}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* AI Coach */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI Coach</Text>
            <Text style={[styles.rowSub, { marginBottom: 12 }]}>
              Optional — adds AI chat to the AI tab. Rule-based insights work without a key.
            </Text>

            {/* Provider picker */}
            <Text style={styles.sectionLabel}>Provider</Text>
            <View style={styles.segmented}>
              {(['grok', 'groq', 'custom'] as AiProvider[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => updateAiConfig({ provider: p })}
                  style={[styles.segment, aiConfig.provider === p && styles.segmentActive]}>
                  <Text style={[styles.segmentText, aiConfig.provider === p && styles.segmentTextActive]}>
                    {p === 'grok' ? 'Grok (xAI)' : p === 'groq' ? 'Groq/Llama' : 'Custom'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.divider} />

            {/* API Key */}
            <Text style={styles.fieldLabel}>API Key</Text>
            <TextInput
              style={[styles.fieldInput, { width: '100%', marginTop: 6 }]}
              value={apiKeyInput}
              onChangeText={(t) => { setApiKeyInput(t); setApiKeySaved(false); }}
              placeholder="Paste your API key here"
              placeholderTextColor={AppColors.muted}
              secureTextEntry
              autoCorrect={false}
              autoCapitalize="none"
            />
            <Pressable
              style={({ pressed }) => [styles.saveKeyBtn, pressed && { opacity: 0.75 }, apiKeySaved && styles.saveKeyBtnDone]}
              onPress={saveApiKey}>
              <Text style={styles.saveKeyText}>{apiKeySaved ? '✓ Saved' : 'Save API Key'}</Text>
            </Pressable>

            {/* Model name (auto-filled for grok/groq) */}
            <View style={styles.divider} />
            <Text style={styles.fieldLabel}>Model</Text>
            <TextInput
              style={[styles.fieldInput, { width: '100%', marginTop: 6 }]}
              value={aiConfig.model}
              onChangeText={(t) => {
                setCustomModel(t);
                updateAiConfig({ model: t });
              }}
              placeholder="e.g. grok-3-mini"
              placeholderTextColor={AppColors.muted}
              autoCorrect={false}
              autoCapitalize="none"
            />

            {/* Base URL (only for custom) */}
            {aiConfig.provider === 'custom' && (
              <>
                <View style={styles.divider} />
                <Text style={styles.fieldLabel}>Base URL</Text>
                <TextInput
                  style={[styles.fieldInput, { width: '100%', marginTop: 6 }]}
                  value={aiConfig.baseUrl}
                  onChangeText={(t) => {
                    setCustomBaseUrl(t);
                    updateAiConfig({ baseUrl: t });
                  }}
                  placeholder="https://api.example.com/v1"
                  placeholderTextColor={AppColors.muted}
                  autoCorrect={false}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </>
            )}

            {aiConfig.provider !== 'custom' && (
              <Text style={[styles.rowSub, { marginTop: 8 }]}>
                Endpoint: {providerPresets[aiConfig.provider].baseUrl}
              </Text>
            )}
          </View>

          {/* About */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.about}>
              Daily Health Tracker v2.0{'\n'}
              Comprehensive weight loss monitor{'\n'}
              Built with Expo + React Native
            </Text>
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* AI Suggest Results Modal */}
      <Modal
        visible={showSuggestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSuggestModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSuggestModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>✨ AI Suggestions</Text>
            <Text style={[styles.rowSub, { marginBottom: 8 }]}>Tap any to add to your context:</Text>
            {suggestions.length === 0 && (
              <Text style={[styles.rowSub, { textAlign: 'center', marginVertical: 8 }]}>All added!</Text>
            )}
            {suggestions.map((s, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.suggestionItem, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  addField('lifestyle', s, 'lifestyle');
                  setSuggestions((prev) => prev.filter((_, j) => j !== i));
                }}>
                <Text style={styles.suggestionText}>+ {s}</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.addBtn, { marginTop: 10 }]}
              onPress={() => setShowSuggestModal(false)}>
              <Text style={styles.addBtnText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add AI Context Field Modal */}
      <Modal
        visible={addContextModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddContextModal((p) => ({ ...p, visible: false }))}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAddContextModal((p) => ({ ...p, visible: false }))}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              Add {CATEGORY_LABELS[addContextModal.category]}
            </Text>

            {addContextModal.category === 'custom' && (
              <TextInput
                style={styles.modalInput}
                value={addContextModal.label}
                onChangeText={(t) => setAddContextModal((p) => ({ ...p, label: t }))}
                placeholder={CATEGORY_PLACEHOLDERS[addContextModal.category].label}
                placeholderTextColor={AppColors.muted}
              />
            )}

            <TextInput
              style={styles.modalInput}
              value={addContextModal.value}
              onChangeText={(t) => setAddContextModal((p) => ({ ...p, value: t }))}
              placeholder={CATEGORY_PLACEHOLDERS[addContextModal.category].value}
              placeholderTextColor={AppColors.muted}
              autoFocus
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setAddContextModal((p) => ({ ...p, visible: false }))}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.addBtn, !addContextModal.value.trim() && styles.addBtnDisabled]}
                disabled={!addContextModal.value.trim()}
                onPress={() => {
                  addField(
                    addContextModal.category === 'custom' ? addContextModal.label : addContextModal.category,
                    addContextModal.value.trim(),
                    addContextModal.category
                  );
                  setAddContextModal((p) => ({ ...p, visible: false }));
                }}>
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Custom Reminder Modal */}
      <Modal
        visible={customModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomModal((p) => ({ ...p, visible: false }))}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCustomModal((p) => ({ ...p, visible: false }))}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add reminder</Text>
            <TextInput
              style={styles.modalInput}
              value={customModal.label}
              onChangeText={(t) => setCustomModal((p) => ({ ...p, label: t }))}
              placeholder="e.g. Take vitamins, Stretch, Call mom"
              placeholderTextColor={AppColors.muted}
              autoFocus
            />
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { flex: 1 }]}>Time</Text>
              <Pressable
                style={({ pressed }) => [styles.timeChip, pressed && styles.actionBtnPressed]}
                onPress={() => openTimePicker({ kind: 'custom-new' }, customModal.hour, customModal.minute)}>
                <Text style={styles.timeChipText}>{formatTime12h(customModal.hour, customModal.minute)}</Text>
              </Pressable>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setCustomModal((p) => ({ ...p, visible: false }))}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.addBtn, !customModal.label.trim() && styles.addBtnDisabled]}
                disabled={!customModal.label.trim()}
                onPress={() => {
                  addCustomReminder(customModal.label.trim(), customModal.hour, customModal.minute);
                  setCustomModal((p) => ({ ...p, visible: false }));
                }}>
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Shared time picker (rendered last so it sits above other modals) */}
      <TimePickerModal
        visible={timeTarget !== null}
        initialHour={timeInit.hour}
        initialMinute={timeInit.minute}
        onCancel={() => setTimeTarget(null)}
        onSave={handleTimeSave}
      />
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
  head: { marginBottom: 16, marginTop: 4 },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    fontWeight: '600',
    color: AppColors.ink,
  },

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
  cardTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.ink,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.line,
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 11,
    color: AppColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: AppColors.ink },
  rowSub: { fontSize: 12, color: AppColors.muted, marginTop: 2 },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.line,
  },
  slotLabel: { flex: 1, fontSize: 13, color: AppColors.ink },
  slotSwitch: { transform: [{ scale: 0.85 }] },
  timeChip: {
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    backgroundColor: AppColors.cream,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  timeChipText: { fontSize: 12, fontWeight: '700', color: AppColors.greenDeep },

  infoGrid: { gap: 14 },
  infoField: { gap: 6 },
  fieldLabel: { fontSize: 12, color: AppColors.muted, fontWeight: '500' },
  fieldInput: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: AppColors.ink,
    backgroundColor: AppColors.cream,
    width: 80,
  },
  segmented: { flexDirection: 'row', gap: 8 },
  segment: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: AppColors.cream,
  },
  segmentActive: {
    backgroundColor: AppColors.green,
    borderColor: AppColors.green,
  },
  segmentText: { fontSize: 13, color: AppColors.ink },
  segmentTextActive: { color: AppColors.white, fontWeight: '600' },
  activityOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  activityOption: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: AppColors.cream,
  },
  activityOptionActive: {
    backgroundColor: AppColors.green,
    borderColor: AppColors.green,
  },
  activityOptionText: { fontSize: 12, color: AppColors.ink },
  activityOptionTextActive: { color: AppColors.white, fontWeight: '600' },

  actionBtn: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnDanger: { borderColor: AppColors.amberLine },
  actionBtnPressed: { opacity: 0.7 },
  actionBtnText: { fontSize: 14, fontWeight: '500', color: AppColors.ink },
  actionBtnTextDanger: { color: AppColors.amber },

  about: {
    fontSize: 13,
    color: AppColors.muted,
    lineHeight: 20,
  },

  saveKeyBtn: {
    backgroundColor: AppColors.green,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveKeyBtnDone: { backgroundColor: AppColors.greenDeep },
  saveKeyText: { fontSize: 13, fontWeight: '700', color: AppColors.white },

  suggestBtn: {
    backgroundColor: AppColors.green,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 2,
  },
  suggestBtnText: { fontSize: 13, fontWeight: '700', color: AppColors.white },

  suggestionItem: {
    backgroundColor: AppColors.greenSoft,
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  suggestionText: { fontSize: 13, color: AppColors.greenDeep, fontWeight: '500' },

  // AI Context
  contextCategory: { marginBottom: 12 },
  contextField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.cream,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  contextValue: { flex: 1, fontSize: 13, color: AppColors.ink },
  deleteBtn: { padding: 4 },
  deleteText: { fontSize: 18, color: AppColors.muted, lineHeight: 20 },
  addContextBtn: {
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  addContextText: { fontSize: 12, color: AppColors.green, fontWeight: '600' },

  // Modal
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
