import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';
import type { ChecklistItem } from '@/constants/checklist-data';

type Props = {
  item: ChecklistItem & { isBuiltIn?: boolean };
  checked: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
};

export function ChecklistItemRow({ item, checked, onToggle, onLongPress }: Props) {
  const isAvoid = !!item.avoid;

  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.item,
        isAvoid ? styles.avoidItem : styles.doItem,
        checked && (isAvoid ? styles.avoidChecked : styles.doChecked),
        pressed && styles.pressed,
      ]}>
      {/* Checkbox/X box */}
      <View
        style={[
          styles.box,
          isAvoid ? styles.avoidBox : styles.doBox,
          checked && styles.checkedBox,
        ]}>
        {checked ? (
          <CheckIcon />
        ) : isAvoid ? (
          <XIcon />
        ) : null}
      </View>

      {/* Text */}
      <View style={styles.textArea}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.main,
              checked && styles.mainChecked,
              isAvoid && !checked && styles.mainAmber,
            ]}
            numberOfLines={2}>
            {item.main}
          </Text>
          {isAvoid && (
            <View style={[styles.badge, checked && styles.badgeDone]}>
              <Text style={[styles.badgeText, checked && styles.badgeTextDone]}>
                {checked ? 'AVOIDED' : 'RESIST'}
              </Text>
            </View>
          )}
        </View>
        {!!item.sub && <Text style={styles.sub}>{item.sub}</Text>}
      </View>
    </Pressable>
  );
}

function CheckIcon() {
  return (
    <Text style={styles.checkIcon}>✓</Text>
  );
}

function XIcon() {
  return (
    <Text style={styles.xIcon}>✕</Text>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    minHeight: 56,
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  doItem: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
  },
  avoidItem: {
    backgroundColor: AppColors.amberSoft,
    borderWidth: 1,
    borderColor: AppColors.amberLine,
  },
  doChecked: {
    backgroundColor: AppColors.greenSoft,
    borderColor: AppColors.greenLine,
  },
  avoidChecked: {
    backgroundColor: AppColors.greenSoft,
    borderColor: AppColors.greenLine,
  },
  pressed: {
    transform: [{ scale: 0.995 }],
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  doBox: {
    borderColor: AppColors.greenLine,
    backgroundColor: 'transparent',
  },
  avoidBox: {
    borderColor: AppColors.amberLine,
    backgroundColor: AppColors.white,
  },
  checkedBox: {
    backgroundColor: AppColors.green,
    borderColor: AppColors.green,
  },
  checkIcon: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  xIcon: {
    color: AppColors.amber,
    fontSize: 13,
    fontWeight: '700',
  },
  textArea: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  main: {
    fontWeight: '500',
    fontSize: 15,
    color: AppColors.ink,
    flexShrink: 1,
  },
  mainChecked: {
    color: AppColors.greenDeep,
  },
  mainAmber: {
    color: AppColors.ink,
  },
  sub: {
    fontSize: 12.5,
    color: AppColors.muted,
    marginTop: 3,
  },
  badge: {
    backgroundColor: AppColors.amberLine,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  badgeDone: {
    backgroundColor: AppColors.greenLine,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: AppColors.amberDeep,
    textTransform: 'uppercase',
  },
  badgeTextDone: {
    color: AppColors.greenDeep,
  },
});
