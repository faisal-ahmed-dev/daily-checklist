import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors, MaxContentWidth } from '@/constants/theme';
import { useMealPlan } from '@/hooks/use-meal-plan';

export function MealPlanCard({ calorieTarget }: { calorieTarget: number }) {
  const { plan, loading, error, generate } = useMealPlan(calorieTarget);
  const [open, setOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={() => {
          setOpen((v) => !v);
          if (!open && !plan) generate();
        }}>
        <Text style={styles.title}>🍱 Weekly Meal Plan</Text>
        <Text style={styles.toggle}>{open ? '▲' : '▾ Generate'}</Text>
      </Pressable>

      {open && (
        <View style={styles.body}>
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={AppColors.green} />
              <Text style={styles.loadingTxt}>Building your 7-day BD plan…</Text>
            </View>
          )}
          {error && !loading && <Text style={styles.note}>{error}</Text>}

          {plan && !loading && (
            <>
              <Text style={styles.sub}>
                ~{calorieTarget} kcal/day target · {plan.source === 'ai' ? 'AI-generated' : 'standard plan'}
              </Text>
              {plan.days.map((d) => {
                const isOpen = expandedDay === d.day;
                return (
                  <View key={d.day} style={styles.day}>
                    <Pressable style={styles.dayHead} onPress={() => setExpandedDay(isOpen ? null : d.day)}>
                      <Text style={styles.dayName}>{d.day}</Text>
                      <Text style={styles.dayKcal}>{d.total} kcal {isOpen ? '▲' : '▾'}</Text>
                    </Pressable>
                    {isOpen &&
                      d.meals.map((m) => (
                        <View key={m.label} style={styles.meal}>
                          <Text style={styles.mealLabel}>{m.label}</Text>
                          <Text style={styles.mealItems}>{m.items}</Text>
                          <Text style={styles.mealKcal}>{m.kcal} kcal</Text>
                        </View>
                      ))}
                  </View>
                );
              })}
              <Pressable
                style={({ pressed }) => [styles.regenBtn, pressed && { opacity: 0.7 }]}
                onPress={generate}>
                <Text style={styles.regenTxt}>↻ Regenerate</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 16,
    marginHorizontal: 14,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    marginTop: 10,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  title: { fontFamily: 'Fraunces_600SemiBold', fontSize: 15, fontWeight: '600', color: AppColors.ink },
  toggle: { fontSize: 13, color: AppColors.green, fontWeight: '600' },
  body: { paddingHorizontal: 14, paddingBottom: 14 },
  sub: { fontSize: 11, color: AppColors.muted, marginBottom: 8 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  loadingTxt: { fontSize: 13, color: AppColors.muted },
  note: { fontSize: 12, color: AppColors.amberDeep, marginBottom: 8 },

  day: { borderTopWidth: 1, borderTopColor: AppColors.line },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  dayName: { fontSize: 14, fontWeight: '700', color: AppColors.ink },
  dayKcal: { fontSize: 12, color: AppColors.green, fontWeight: '700' },
  meal: { paddingVertical: 6, paddingLeft: 8 },
  mealLabel: { fontSize: 11, fontWeight: '700', color: AppColors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  mealItems: { fontSize: 13, color: AppColors.ink, marginTop: 1 },
  mealKcal: { fontSize: 11, color: AppColors.muted, marginTop: 1 },

  regenBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  regenTxt: { fontSize: 12, color: AppColors.green, fontWeight: '600' },
});
