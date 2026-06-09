import { StyleSheet, View, ViewProps } from 'react-native';
import { AppColors } from '@/constants/theme';

type CardVariant = 'default' | 'green' | 'amber' | 'dark';

type Props = ViewProps & { variant?: CardVariant };

export function Card({ style, variant = 'default', ...props }: Props) {
  return (
    <View
      style={[styles.base, variantStyles[variant], style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#3C321E',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
  },
  green: {
    backgroundColor: AppColors.greenSoft,
    borderWidth: 1,
    borderColor: AppColors.greenLine,
  },
  amber: {
    backgroundColor: AppColors.amberSoft,
    borderWidth: 1,
    borderColor: AppColors.amberLine,
  },
  dark: {
    backgroundColor: AppColors.greenDeep,
  },
});
