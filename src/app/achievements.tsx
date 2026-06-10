import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { AppColors, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useWeightLog } from '@/hooks/use-weight-log';
import { useStreak } from '@/hooks/use-streak';
import { useAchievements } from '@/hooks/use-achievements';
import { NOTIF_CHANNELS } from '@/lib/notification-tasks';

export default function AchievementsScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const router = useRouter();
  const { kgLost, paceStatus } = useWeightLog();
  const { streak } = useStreak();
  const { unlocked, newly, xp, level, all, clearNewly } = useAchievements({
    kgLost,
    streak,
    onPace: paceStatus.onPace,
  });

  // Fire a one-off notification for any freshly-unlocked badge, then clear.
  useEffect(() => {
    if (newly.length === 0) return;
    (async () => {
      for (const a of newly) {
        await Notifications.scheduleNotificationAsync({
          content: { title: `🏆 Achievement unlocked: ${a.title}`, body: `${a.emoji} ${a.desc} (+${a.xp} XP)`, sound: true },
          trigger: { channelId: NOTIF_CHANNELS.general, seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
        });
      }
      clearNewly();
    })();
  }, [newly, clearNewly]);

  if (!fontsLoaded) return null;

  const pct = Math.min(1, level.intoLevel / level.needed);
  const earnedCount = unlocked.length;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + 24 }]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Achievements</Text>

          {/* Level bar */}
          <View style={styles.levelCard}>
            <View style={styles.levelRow}>
              <Text style={styles.levelNum}>Level {level.level}</Text>
              <Text style={styles.levelXp}>{xp} XP · {earnedCount}/{all.length} badges</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct * 100}%` }]} />
            </View>
            <Text style={styles.levelHint}>{level.needed - level.intoLevel} XP to level {level.level + 1}</Text>
          </View>

          {/* Badge grid */}
          <View style={styles.grid}>
            {all.map((a) => {
              const got = unlocked.includes(a.id);
              return (
                <View key={a.id} style={[styles.badge, !got && styles.badgeLocked]}>
                  <Text style={[styles.badgeEmoji, !got && styles.locked]}>{got ? a.emoji : '🔒'}</Text>
                  <Text style={[styles.badgeTitle, !got && styles.locked]}>{a.title}</Text>
                  <Text style={styles.badgeDesc}>{a.desc}</Text>
                  <Text style={[styles.badgeXp, got && styles.badgeXpGot]}>+{a.xp} XP</Text>
                </View>
              );
            })}
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.cream },
  content: { paddingHorizontal: 14, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  back: { fontSize: 14, color: AppColors.green, fontWeight: '600', marginTop: 4, marginBottom: 6 },
  title: { fontFamily: 'Fraunces_600SemiBold', fontSize: 26, fontWeight: '600', color: AppColors.ink, marginBottom: 14 },

  levelCard: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  levelNum: { fontFamily: 'Fraunces_600SemiBold', fontSize: 20, fontWeight: '600', color: AppColors.greenDeep },
  levelXp: { fontSize: 12, color: AppColors.muted, fontWeight: '600' },
  track: { height: 8, backgroundColor: AppColors.line, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: AppColors.green, borderRadius: 99 },
  levelHint: { fontSize: 11, color: AppColors.muted, marginTop: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    width: '47%',
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 3,
  },
  badgeLocked: { borderColor: AppColors.line, backgroundColor: AppColors.cream },
  badgeEmoji: { fontSize: 30 },
  locked: { opacity: 0.5 },
  badgeTitle: { fontSize: 13, fontWeight: '700', color: AppColors.ink, textAlign: 'center' },
  badgeDesc: { fontSize: 11, color: AppColors.muted, textAlign: 'center' },
  badgeXp: { fontSize: 11, fontWeight: '700', color: AppColors.muted, marginTop: 2 },
  badgeXpGot: { color: AppColors.green },
});
