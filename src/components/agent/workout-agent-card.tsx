import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';
import type { WorkoutNudge } from '@/hooks/use-workout-agent';

type Props = { suggestion: WorkoutNudge | null };

export function WorkoutAgentCard({ suggestion }: Props) {
  if (!suggestion) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{suggestion.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{suggestion.title}</Text>
        <Text style={styles.body}>{suggestion.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: AppColors.amberSoft,
    borderWidth: 1,
    borderColor: AppColors.amberLine,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  emoji: { fontSize: 22 },
  title: { fontSize: 14, fontWeight: '700', color: AppColors.amberDeep },
  body: { fontSize: 13, color: AppColors.ink, marginTop: 2, lineHeight: 18 },
});
