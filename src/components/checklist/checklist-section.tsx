import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';
import type { ChecklistSection } from '@/constants/checklist-data';
import { ChecklistItemRow } from './checklist-item';

type Props = {
  section: ChecklistSection;
  completed: Record<string, boolean>;
  isActive: boolean;
  onToggle: (id: string) => void;
};

export function ChecklistSectionBlock({ section, completed, isActive, onToggle }: Props) {
  return (
    <View style={[styles.section, isActive && styles.sectionActive]}>
      <View style={styles.sectionTitle}>
        <Text style={styles.titleText}>{section.title}</Text>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{section.time}</Text>
        </View>
        {isActive && (
          <View style={styles.nowBadge}>
            <Text style={styles.nowText}>NOW</Text>
          </View>
        )}
      </View>

      {section.items.map((item) => (
        <ChecklistItemRow
          key={item.id}
          item={item}
          checked={!!completed[item.id]}
          onToggle={() => onToggle(item.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    borderRadius: 18,
    padding: 2,
  },
  sectionActive: {
    backgroundColor: 'rgba(47, 107, 79, 0.06)',
    padding: 10,
    marginHorizontal: -10,
    marginBottom: 20,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginHorizontal: 2,
    flexWrap: 'wrap',
  },
  titleText: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.ink,
  },
  timeBadge: {
    backgroundColor: AppColors.cream,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.muted,
  },
  nowBadge: {
    backgroundColor: AppColors.green,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  nowText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.white,
    letterSpacing: 0.5,
  },
});
