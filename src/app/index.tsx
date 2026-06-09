import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

import {
  CHECKLIST_SECTIONS,
  MOTIVATIONAL_QUOTES,
  getActiveSection,
  getNowFocusText,
  TOTAL_ITEMS,
} from '@/constants/checklist-data';
import { AppColors, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { greetingText, prettyDate, dayOfYear } from '@/lib/date-utils';
import { useChecklist } from '@/hooks/use-checklist';
import { useStreak } from '@/hooks/use-streak';
import { ChecklistSectionBlock } from '@/components/checklist/checklist-section';
import { WaterTracker } from '@/components/checklist/water-tracker';
import { FastingTimer } from '@/components/checklist/fasting-timer';

export default function ChecklistScreen() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  const { completed, toggle, reset, doneCount, totalCount, allDone, progressPct } = useChecklist();
  const { streak, markComplete } = useStreak();
  const [nowText, setNowText] = useState(getNowFocusText());
  const [clock, setClock] = useState(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  const [activeSection, setActiveSection] = useState<string | null>(getActiveSection());
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const tick = setInterval(() => {
      setNowText(getNowFocusText());
      setClock(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      setActiveSection(getActiveSection());
    }, 60000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPct,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [progressPct]);

  useEffect(() => {
    if (allDone) markComplete();
  }, [allDone]);

  const quote = MOTIVATIONAL_QUOTES[dayOfYear() % MOTIVATIONAL_QUOTES.length];

  if (!fontsLoaded) return null;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BottomTabInset + Spacing.four },
        ]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Header */}
          <View style={styles.head}>
            <Text style={styles.greeting}>{greetingText()}</Text>
            <Text style={styles.date}>{prettyDate()}</Text>
          </View>

          {/* Right Now Banner */}
          <View style={styles.nowBanner}>
            <View style={styles.nowLabel}>
              <View style={styles.dot} />
              <Text style={styles.nowLabelText}>RIGHT NOW</Text>
            </View>
            <Text style={styles.nowFocus}>{nowText}</Text>
            <Text style={styles.nowClock}>{clock}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>STREAK</Text>
              <Text style={styles.statBig}>
                {streak} <Text style={styles.statUnit}>days</Text>
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>GOAL</Text>
              <Text style={styles.statBig}>
                89<Text style={styles.statUnit}> → 70 kg</Text>
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text style={styles.progressTitle}>Today's progress</Text>
              <Text style={styles.progressCount}>
                {doneCount}/{totalCount}
              </Text>
            </View>
            <View style={styles.track}>
              <Animated.View
                style={[
                  styles.fill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            {allDone && (
              <Text style={styles.doneMsg}>
                All done for today. This is exactly how 89 becomes 70. See you tomorrow.
              </Text>
            )}
          </View>

          {/* Quote */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>"{quote}"</Text>
          </View>

          {/* Fasting Timer */}
          <FastingTimer durationHours={16} />

          {/* Water Tracker */}
          <WaterTracker />

          {/* Checklist */}
          {CHECKLIST_SECTIONS.map((section) => (
            <ChecklistSectionBlock
              key={section.key}
              section={section}
              completed={completed}
              isActive={activeSection === section.key}
              onToggle={toggle}
            />
          ))}

          {/* Alarm reference */}
          <View style={styles.alarmCard}>
            <Text style={styles.alarmTitle}>Recommended alarm times</Text>
            <Text style={styles.alarmSub}>
              Notifications are scheduled automatically. Set these as backup phone alarms.
            </Text>
            {[
              { time: '6:00 AM', label: 'Morning walk before getting ready' },
              { time: '10:00 AM', label: 'Rong cha — not Nescafe' },
              { time: '1:00 PM', label: 'Lunch — 1 cup rice max + salad' },
              { time: '4:00 PM', label: 'Healthy snack — not Nescafe' },
              { time: '8:30 PM', label: 'Dinner now, then a 20-min walk' },
              { time: '10:30 PM', label: 'Wind down — sleep 7+ hours' },
            ].map((a, i) => (
              <View
                key={i}
                style={[styles.alarmRow, i < 5 && styles.alarmRowBorder]}>
                <Text style={styles.alarmTime}>{a.time}</Text>
                <Text style={styles.alarmLabel}>{a.label}</Text>
              </View>
            ))}
          </View>

          {/* Reset */}
          <View style={styles.resetRow}>
            <Pressable onPress={reset} style={({ pressed }) => [styles.resetBtn, pressed && styles.resetBtnPressed]}>
              <Text style={styles.resetText}>Reset today</Text>
            </Pressable>
          </View>
          <Text style={styles.footer}>
            Checklist resets automatically every morning.{'\n'}
            Weigh yourself once a week — same day, morning, empty stomach.
          </Text>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.cream,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 14,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  head: { marginBottom: 14, marginTop: 4 },
  greeting: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 36,
    color: AppColors.ink,
  },
  date: { color: AppColors.muted, fontSize: 14, marginTop: 4 },

  nowBanner: {
    backgroundColor: AppColors.greenDeep,
    borderRadius: 18,
    padding: 15,
    marginBottom: 16,
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  nowLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#7FD6A4',
  },
  nowLabelText: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: '#F4EFE2',
    opacity: 0.7,
  },
  nowFocus: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 19,
    fontWeight: '600',
    color: '#F4EFE2',
    lineHeight: 24,
  },
  nowClock: { fontSize: 13, color: '#F4EFE2', opacity: 0.75, marginTop: 3 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 16,
    padding: 13,
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statLabel: {
    fontSize: 11,
    color: AppColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  statBig: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 24,
    fontWeight: '600',
    color: AppColors.ink,
    marginTop: 3,
  },
  statUnit: { fontSize: 13, color: AppColors.muted, fontFamily: 'DMSans_400Regular' },

  progressCard: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 },
  progressTitle: { fontWeight: '600', fontSize: 14, color: AppColors.ink },
  progressCount: {
    fontFamily: 'Fraunces_600SemiBold',
    fontWeight: '600',
    fontSize: 19,
    color: AppColors.green,
  },
  track: { height: 11, backgroundColor: AppColors.greenSoft, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: AppColors.green, borderRadius: 99 },
  doneMsg: {
    marginTop: 11,
    fontSize: 13.5,
    color: AppColors.greenDeep,
    backgroundColor: AppColors.greenSoft,
    padding: 10,
    borderRadius: 12,
  },

  quoteCard: {
    backgroundColor: AppColors.amberSoft,
    borderWidth: 1,
    borderColor: AppColors.amberLine,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  quoteText: {
    fontSize: 13,
    color: AppColors.amberDeep,
    fontStyle: 'italic',
    lineHeight: 19,
  },

  alarmCard: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  alarmTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.ink,
    marginBottom: 4,
  },
  alarmSub: { fontSize: 12.5, color: AppColors.muted, marginBottom: 11 },
  alarmRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  alarmRowBorder: { borderBottomWidth: 1, borderBottomColor: AppColors.line },
  alarmTime: {
    fontFamily: 'Fraunces_600SemiBold',
    fontWeight: '600',
    fontSize: 15,
    color: AppColors.green,
    width: 78,
  },
  alarmLabel: { flex: 1, fontSize: 13.5, color: AppColors.ink },

  resetRow: { alignItems: 'center', marginTop: 10 },
  resetBtn: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  resetBtnPressed: { backgroundColor: AppColors.cream },
  resetText: { fontSize: 13, color: AppColors.muted },

  footer: {
    textAlign: 'center',
    color: AppColors.muted,
    fontSize: 12,
    marginTop: 22,
    lineHeight: 19,
    marginBottom: 8,
  },
});
