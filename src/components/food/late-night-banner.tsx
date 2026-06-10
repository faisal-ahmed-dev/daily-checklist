import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';

type Props = { visible: boolean };

export function LateNightBanner({ visible }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        ⚠️ Eating after 9 PM — fat is stored, not burned. Try to finish dinner by 8 PM.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FBBF24',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
});
