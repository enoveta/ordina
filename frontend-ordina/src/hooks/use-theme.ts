import { useAppTheme } from '@/providers/theme-provider';
import type { ThemePreference } from '@/constants/theme';

export function useTheme() {
  const { colors } = useAppTheme();
  return colors;
}

export function useThemePreference() {
  const { preference, setPreference } = useAppTheme();
  return { preference, setPreference };
}
