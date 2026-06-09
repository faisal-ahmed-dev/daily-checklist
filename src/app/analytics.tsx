import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

import { AppColors, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAnalytics } from '@/hooks/use-analytics';
import { CHECKLIST_SECTIONS } from '@/constants/checklist-data';
import { shortDate } from '@/lib/date-utils';

export default function AnalyticsScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const { last30, last7, perHabitRates, weeklyAvgPct, monthlyAvgPct, perfectDays, loaded, reload } =
    useAnalytics();

  useEffect(() => {
    reload();
  }, []);

  if (!fontsLoaded || !loaded) return null;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.four }]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View style={styles.head}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Last 30 days</Text>
          </View>

          {/* Summary stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>THIS WEEK</Text>
              <Text style={styles.statBig}>{Math.round(weeklyAvgPct * 100)}%</Text>
              <Text style={styles.statSub}>avg completion</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>THIS MONTH</Text>
              <Text style={styles.statBig}>{Math.round(monthlyAvgPct * 100)}%</Text>
              <Text style={styles.statSub}>avg completion</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>PERFECT DAYS</Text>
              <Text style={styles.statBig}>{perfectDays}</Text>
              <Text style={styles.statSub}>100% complete</Text>
            </View>
          </View>

          {/* Heat map calendar */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DAILY COMPLETION — LAST 30 DAYS</Text>
            <View style={styles.heatmap}>
              {last30.map((day) => {
                const color =
                  day.pct === 0
                    ? AppColors.line
                    : day.pct < 0.5
                    ? AppColors.amberLine
                    : day.pct < 1
                    ? AppColors.greenLine
                    : AppColors.green;
                return (
                  <View key={day.date} style={styles.heatCell}>
                    <View style={[styles.heatBox, { backgroundColor: color }]} />
                    <Text style={styles.heatLabel}>{shortDate(day.date).split(' ')[0]}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.legend}>
              {[
                { color: AppColors.line, label: '0%' },
                { color: AppColors.amberLine, label: '<50%' },
                { color: AppColors.greenLine, label: '<100%' },
                { color: AppColors.green, label: '100%' },
              ].map((l) => (
                <View key={l.label} style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: l.color }]} />
                  <Text style={styles.legendLabel}>{l.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Weekly bar chart */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>THIS WEEK — DAILY COMPLETION</Text>
            <View style={styles.barChart}>
              {last7.map((day) => {
                const pct = day.pct;
                const dayName = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' });
                return (
                  <View key={day.date} style={styles.barCol}>
                    <Text style={styles.barPct}>
                      {pct > 0 ? Math.round(pct * 100) + '%' : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${Math.round(pct * 100)}%` },
                          pct === 1 && styles.barFillPerfect,
                        ]}
                      />
                    </View>
                    <Text style={styles.barDay}>{dayName}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Per-habit completion rates */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>HABIT COMPLETION RATES (30 DAYS)</Text>
            {CHECKLIST_SECTIONS.map((section) => (
              <View key={section.key} style={styles.habitSection}>
                <Text style={styles.habitSectionTitle}>{section.title}</Text>
                {section.items.map((item) => {
                  const rate = perHabitRates[item.id] ?? 0;
                  return (
                    <View key={item.id} style={styles.habitRow}>
                      <Text style={styles.habitName} numberOfLines={1}>
                        {item.main}
                      </Text>
                      <View style={styles.habitBarTrack}>
                        <View
                          style={[
                            styles.habitBarFill,
                            { width: `${Math.round(rate * 100)}%` },
                            item.avoid && styles.habitBarAvoid,
                          ]}
                        />
                      </View>
                      <Text style={styles.habitRate}>{Math.round(rate * 100)}%</Text>
                    </View>
                  );
                })}
              </View>
            ))}
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
  subtitle: { fontSize: 14, color: AppColors.muted, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statLabel: {
    fontSize: 9,
    color: AppColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  statBig: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    fontWeight: '600',
    color: AppColors.ink,
    marginTop: 2,
  },
  statSub: { fontSize: 10, color: AppColors.muted, textAlign: 'center' },

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
    marginBottom: 12,
  },

  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  heatCell: { alignItems: 'center', width: 30 },
  heatBox: { width: 24, height: 24, borderRadius: 5 },
  heatLabel: { fontSize: 8, color: AppColors.muted, marginTop: 2 },
  legend: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendBox: { width: 12, height: 12, borderRadius: 3 },
  legendLabel: { fontSize: 10, color: AppColors.muted },

  barChart: {
    flexDirection: 'row',
    gap: 6,
    height: 120,
    alignItems: 'flex-end',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barPct: { fontSize: 8, color: AppColors.muted, marginBottom: 2 },
  barTrack: {
    flex: 1,
    width: '80%',
    backgroundColor: AppColors.greenSoft,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', backgroundColor: AppColors.greenLine, borderRadius: 4 },
  barFillPerfect: { backgroundColor: AppColors.green },
  barDay: { fontSize: 9, color: AppColors.muted, marginTop: 3 },

  habitSection: { marginBottom: 14 },
  habitSectionTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.ink,
    marginBottom: 8,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  habitName: { fontSize: 12, color: AppColors.ink, width: 120 },
  habitBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: AppColors.greenSoft,
    borderRadius: 99,
    overflow: 'hidden',
  },
  habitBarFill: { height: '100%', backgroundColor: AppColors.green, borderRadius: 99 },
  habitBarAvoid: { backgroundColor: AppColors.amber },
  habitRate: { fontSize: 11, color: AppColors.muted, width: 32, textAlign: 'right' },
});
