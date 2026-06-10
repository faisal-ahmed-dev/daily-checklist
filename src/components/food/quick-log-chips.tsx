import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { BD_FOODS } from '@/lib/bd-foods';
import { AppColors } from '@/constants/theme';

type Props = {
  onLog: (name: string, cal: number) => void;
};

export function QuickLogChips({ onLog }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}>
      {BD_FOODS.map((food) => (
        <Pressable
          key={food.name}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          onPress={() => onLog(food.name, food.cal)}>
          <Text style={styles.chipText}>
            {food.emoji} {food.name} — {food.cal}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginBottom: 10 },
  content: { gap: 6, paddingHorizontal: 2 },
  chip: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pressed: { opacity: 0.65 },
  chipText: { fontSize: 12, color: AppColors.ink },
});
