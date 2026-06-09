import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

import { AppColors, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useNotifications } from '@/hooks/use-notifications';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useWeightLog } from '@/hooks/use-weight-log';
import { useChecklist } from '@/hooks/use-checklist';
import { NOTIFICATION_SLOTS } from '@/lib/notification-tasks';

export default function SettingsScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const { settings, requestAndEnable, disable, toggleSlot, toggleWeighIn } = useNotifications();
  const { profile, updateProfile } = useUserProfile();
  const { entries } = useWeightLog();
  const { reset: resetChecklist } = useChecklist();

  const [age, setAge] = useState(String(profile.ageYears));

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
                {NOTIFICATION_SLOTS.filter((s) => s.id !== 'weigh-in').map((slot) => (
                  <View key={slot.id} style={styles.slotRow}>
                    <Text style={styles.slotLabel}>{slot.label}</Text>
                    <Switch
                      value={settings.enabledIds.includes(slot.id)}
                      onValueChange={() => toggleSlot(slot.id)}
                      trackColor={{ false: AppColors.line, true: AppColors.green }}
                      thumbColor={AppColors.white}
                      style={styles.slotSwitch}
                    />
                  </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>Weekly weigh-in (Mondays, 7 AM)</Text>
                  </View>
                  <Switch
                    value={settings.weeklyWeighIn}
                    onValueChange={toggleWeighIn}
                    trackColor={{ false: AppColors.line, true: AppColors.green }}
                    thumbColor={AppColors.white}
                  />
                </View>
              </>
            )}
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

          {/* About */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.about}>
              Daily Checklist v1.0{'\n'}
              Personal weight loss tracker: 89 → 70 kg{'\n'}
              Built with Expo + React Native
            </Text>
          </View>
        </SafeAreaView>
      </ScrollView>
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
});
