import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type BackButtonProps = {
  fallback?: string;
  onPress?: () => void;
};

export function BackButton({ fallback, onPress }: BackButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={() => {
        if (onPress) {
          onPress();
          return;
        }
        if (router.canGoBack()) {
          router.back();
          return;
        }
        if (fallback) router.replace(fallback as never);
      }}
      style={[styles.btn, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Ionicons name="chevron-back" size={22} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
