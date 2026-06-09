import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';
import type { DynamicSection } from '@/hooks/use-dynamic-checklist';
import { ChecklistItemRow } from './checklist-item';

type Props = {
  section: DynamicSection;
  completed: Record<string, boolean>;
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleItem: (id: string) => void;
  onAddItem: () => void;
  onDeleteItem: (id: string, isBuiltIn: boolean) => void;
};

export function AccordionSection({
  section,
  completed,
  isActive,
  isExpanded,
  onToggleExpand,
  onToggleItem,
  onAddItem,
  onDeleteItem,
}: Props) {
  const doneCount = section.items.filter((i) => completed[i.id]).length;
  const totalCount = section.items.length;
  const sectionPct = totalCount > 0 ? doneCount / totalCount : 0;

  return (
    <View style={[styles.section, isActive && styles.sectionActive]}>
      {/* Header — tap to expand/collapse */}
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        onPress={onToggleExpand}>
        <View style={styles.headerLeft}>
          <Text style={styles.arrow}>{isExpanded ? '▾' : '▸'}</Text>
          <Text style={styles.title}>{section.title}</Text>
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>{section.time}</Text>
          </View>
          {isActive && (
            <View style={styles.nowBadge}>
              <Text style={styles.nowText}>NOW</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.countText, sectionPct >= 1 && styles.countDone]}>
            {doneCount}/{totalCount}
          </Text>
        </View>
      </Pressable>

      {/* Mini progress bar (always visible) */}
      {totalCount > 0 && (
        <View style={styles.miniTrack}>
          <View style={[styles.miniFill, { width: `${sectionPct * 100}%` }]} />
        </View>
      )}

      {/* Items (only when expanded) */}
      {isExpanded && (
        <View style={styles.items}>
          {section.items.length === 0 ? (
            <Text style={styles.emptyText}>No items yet — tap + to add one</Text>
          ) : (
            section.items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                checked={!!completed[item.id]}
                onToggle={() => onToggleItem(item.id)}
                onLongPress={() => onDeleteItem(item.id, item.isBuiltIn)}
              />
            ))
          )}

          {/* Add item button */}
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            onPress={onAddItem}>
            <Text style={styles.addBtnText}>+ Add item</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    overflow: 'hidden',
  },
  sectionActive: {
    borderColor: AppColors.greenLine,
    backgroundColor: AppColors.greenSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  headerRight: {},
  pressed: { opacity: 0.7 },
  arrow: {
    fontSize: 14,
    color: AppColors.muted,
    width: 14,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.ink,
  },
  timeBadge: {
    backgroundColor: AppColors.cream,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.muted,
  },
  nowBadge: {
    backgroundColor: AppColors.green,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nowText: {
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.white,
    letterSpacing: 0.5,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.muted,
  },
  countDone: { color: AppColors.green },

  miniTrack: {
    height: 3,
    backgroundColor: AppColors.line,
    marginHorizontal: 14,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 2,
  },
  miniFill: {
    height: '100%',
    backgroundColor: AppColors.green,
    borderRadius: 99,
  },

  items: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 6,
  },
  emptyText: {
    fontSize: 13,
    color: AppColors.muted,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  addBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    marginTop: 6,
  },
  addBtnText: {
    fontSize: 12,
    color: AppColors.green,
    fontWeight: '600',
  },
});
