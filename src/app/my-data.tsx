import { useEffect, useState } from 'react';
import {
  Alert,
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { AppColors, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { storageGet, storageGetAllKeys } from '@/lib/storage';

type DataSection = {
  key: string;
  title: string;
  data: unknown;
};

export default function MyDataScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const [sections, setSections] = useState<DataSection[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['profile']));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);

    const [
      name,
      profile,
      weightEntries,
      streak,
      water,
      steps,
      dailyLog,
      checklistState,
      customItems,
      hiddenBuiltins,
      customSections,
      aiConfig,
      aiContextFields,
      notifSettings,
      foodLog,
    ] = await Promise.all([
      storageGet('@user/name'),
      storageGet('@user/profile'),
      storageGet('@weight/entries'),
      storageGet('@checklist/streak'),
      storageGet(`@water/glasses_${new Date().toISOString().split('T')[0]}`),
      storageGet(`@pedometer/steps_${new Date().toISOString().split('T')[0]}`),
      storageGet(`@daily_log/entry_${new Date().toISOString().split('T')[0]}`),
      storageGet(`@checklist/state_${new Date().toISOString().split('T')[0]}`),
      storageGet('@checklist/custom_items'),
      storageGet('@checklist/hidden_builtins'),
      storageGet('@checklist/custom_sections'),
      storageGet('@ai/config'),
      storageGet('@ai/context_fields'),
      storageGet('@notifications/settings'),
      storageGet(`@food/log_${new Date().toISOString().split('T')[0]}`),
    ]);

    // Mask the API key in ai config
    const maskedAiConfig = aiConfig
      ? { ...(aiConfig as Record<string, unknown>), apiKey: '***hidden***' }
      : null;

    setSections([
      {
        key: 'profile',
        title: 'Profile',
        data: { name, ...(profile as object ?? {}) },
      },
      {
        key: 'weight',
        title: `Weight Log (${Array.isArray(weightEntries) ? weightEntries.length : 0} entries)`,
        data: weightEntries ?? [],
      },
      {
        key: 'vitals',
        title: "Today's Vitals",
        data: {
          water_glasses: water ?? 0,
          steps: steps ?? 0,
          ...(dailyLog as object ?? {}),
        },
      },
      {
        key: 'food',
        title: "Today's Food Log",
        data: foodLog ?? [],
      },
      {
        key: 'checklist',
        title: 'Checklist',
        data: {
          today_state: checklistState ?? {},
          custom_items: customItems ?? [],
          hidden_builtins: hiddenBuiltins ?? [],
          custom_sections: customSections ?? [],
        },
      },
      {
        key: 'streak',
        title: 'Streak',
        data: streak ?? { streak: 0 },
      },
      {
        key: 'ai_config',
        title: 'AI Config',
        data: maskedAiConfig ?? { note: 'Not configured' },
      },
      {
        key: 'ai_context',
        title: 'AI Context Fields',
        data: aiContextFields ?? [],
      },
      {
        key: 'notifications',
        title: 'Notifications',
        data: notifSettings ?? { enabled: false },
      },
    ]);

    setLoading(false);
  }

  async function exportAllData() {
    const allData: Record<string, unknown> = {};
    sections.forEach((s) => {
      allData[s.key] = s.data;
    });
    const json = JSON.stringify(allData, null, 2);
    const path = (FileSystem.cacheDirectory ?? '') + 'health-data.json';
    await FileSystem.writeAsStringAsync(path, json);
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'Export My Health Data',
    });
  }

  function copySection(section: DataSection) {
    const json = JSON.stringify(section.data, null, 2);
    Clipboard.setString(json);
    Alert.alert('Copied', `${section.title} data copied to clipboard.`);
  }

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (!fontsLoaded) return null;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + 24 }]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>My Data</Text>
            <Pressable
              style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
              onPress={exportAllData}>
              <Text style={styles.exportText}>Export JSON</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            All your stored data in one place. Tap a section to expand.
          </Text>

          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            sections.map((section) => {
              const isExpanded = expanded.has(section.key);
              const json = JSON.stringify(section.data, null, 2);
              return (
                <View key={section.key} style={styles.card}>
                  <Pressable
                    style={({ pressed }) => [styles.cardHeader, pressed && styles.pressed]}
                    onPress={() => toggleExpand(section.key)}>
                    <Text style={styles.cardTitle}>
                      {isExpanded ? '▾ ' : '▸ '}
                      {section.title}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
                      onPress={() => copySection(section)}>
                      <Text style={styles.copyText}>📋 Copy</Text>
                    </Pressable>
                  </Pressable>

                  {isExpanded && (
                    <ScrollView
                      horizontal
                      style={styles.jsonScroll}
                      showsHorizontalScrollIndicator={true}>
                      <Text style={styles.json}>{json}</Text>
                    </ScrollView>
                  )}
                </View>
              );
            })
          )}

          <Pressable
            style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}
            onPress={loadAllData}>
            <Text style={styles.refreshText}>↻ Refresh data</Text>
          </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    fontWeight: '600',
    color: AppColors.ink,
  },
  exportBtn: {
    backgroundColor: AppColors.green,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  exportText: { color: AppColors.white, fontWeight: '600', fontSize: 13 },
  subtitle: {
    fontSize: 13,
    color: AppColors.muted,
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 14,
    color: AppColors.muted,
    textAlign: 'center',
    marginTop: 32,
  },
  card: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.ink,
    flex: 1,
  },
  copyBtn: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  copyText: { fontSize: 12, color: AppColors.muted },
  jsonScroll: {
    borderTopWidth: 1,
    borderTopColor: AppColors.line,
    backgroundColor: AppColors.cream,
    maxHeight: 300,
  },
  json: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: AppColors.ink,
    padding: 12,
    lineHeight: 18,
  },
  pressed: { opacity: 0.7 },
  refreshBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  refreshText: { fontSize: 13, color: AppColors.muted },
});
