import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppColors } from '@/constants/theme';

type Props = {
  visible: boolean;
  initialValue: number;
  title: string;
  label?: string;
  min?: number;
  max?: number;
  onCancel: () => void;
  onSave: (value: number) => void;
};

export function NumberInputModal({
  visible,
  initialValue,
  title,
  label,
  min = 0,
  max = 1_000_000,
  onCancel,
  onSave,
}: Props) {
  const [text, setText] = useState(String(initialValue));

  useEffect(() => {
    if (visible) setText(String(initialValue));
  }, [visible, initialValue]);

  const parsed = parseInt(text, 10);
  const valid = !isNaN(parsed) && parsed >= min && parsed <= max;

  function handleSave() {
    if (valid) onSave(parsed);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {label && <Text style={styles.label}>{label}</Text>}
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
            placeholderTextColor={AppColors.muted}
          />
          {!valid && (
            <Text style={styles.hint}>
              Enter a number between {min.toLocaleString()} and {max.toLocaleString()}.
            </Text>
          )}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, !valid && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!valid}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: AppColors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 38,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '700', color: AppColors.ink },
  label: { fontSize: 13, color: AppColors.muted, marginTop: -4 },
  input: {
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.ink,
    backgroundColor: AppColors.cream,
  },
  hint: { fontSize: 11, color: AppColors.amber },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: AppColors.cream,
  },
  cancelText: { fontSize: 13, color: AppColors.muted, fontWeight: '500' },
  saveBtn: {
    flex: 2,
    backgroundColor: AppColors.green,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: AppColors.greenLine },
  saveText: { fontSize: 13, color: AppColors.white, fontWeight: '700' },
});
