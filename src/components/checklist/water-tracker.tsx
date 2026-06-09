import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';
import { useWater } from '@/hooks/use-water';

export function WaterTracker() {
  const { glasses, addGlass, removeGlass, mlDrunk, mlGoal, goal, done } = useWater();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Water Intake</Text>
        <Text style={[styles.ml, done && styles.mlDone]}>
          {mlDrunk} / {mlGoal} ml
        </Text>
      </View>
      <View style={styles.glasses}>
        {Array.from({ length: goal }).map((_, i) => (
          <Pressable
            key={i}
            onPress={i < glasses ? removeGlass : addGlass}
            style={styles.glassPressable}>
            <View style={[styles.glass, i < glasses && styles.glassFilled]}>
              <Text style={styles.glassIcon}>{i < glasses ? '💧' : '○'}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {done && (
        <Text style={styles.doneText}>2 litres reached! Great job.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.ink,
  },
  ml: {
    fontSize: 13,
    color: AppColors.muted,
    fontWeight: '500',
  },
  mlDone: {
    color: AppColors.green,
  },
  glasses: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  glassPressable: {
    padding: 2,
  },
  glass: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: AppColors.cream,
    borderWidth: 1,
    borderColor: AppColors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassFilled: {
    backgroundColor: '#D6EEF5',
    borderColor: '#82C8DC',
  },
  glassIcon: {
    fontSize: 16,
  },
  doneText: {
    marginTop: 8,
    fontSize: 12.5,
    color: AppColors.greenDeep,
    fontWeight: '500',
  },
});
