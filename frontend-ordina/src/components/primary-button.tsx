import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = PressableProps & {
  label: string;
  glow?: boolean;
};

export function PrimaryButton({ label, disabled, glow, ...rest }: PrimaryButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.primary,
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
          shadowColor: theme.primary,
          shadowOpacity: glow ? 0.55 : 0,
          shadowRadius: glow ? 18 : 0,
          shadowOffset: { width: 0, height: 8 },
          elevation: glow ? 10 : 0,
        },
      ]}
      {...rest}>
      <ThemedText style={[styles.label, { color: theme.onPrimary }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
});
