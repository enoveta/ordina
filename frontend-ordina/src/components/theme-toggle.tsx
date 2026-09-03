import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useAppTheme } from '@/providers/theme-provider';
import { useI18n } from '@/providers/i18n-provider';

export function ThemeToggle() {
  const theme = useTheme();
  const { scheme, setPreference } = useAppTheme();
  const { t } = useI18n();
  const isDark = scheme === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.toggleTheme')}
      onPress={() => setPreference(isDark ? 'light' : 'dark')}
      style={[styles.btn, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
