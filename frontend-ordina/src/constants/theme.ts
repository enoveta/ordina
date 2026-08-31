/**
 * ORDINA colors from the approved screens (dark as designed).
 * Light mode inverts surfaces; purple accents stay the same.
 */

import { Platform } from 'react-native';

export const Brand = {
  primary: '#8B5CF6',
  secondary: '#A78BFA',
  navy: '#000000',
  white: '#FFFFFF',
  softBackground: '#F8FAFC',
  lightBorder: '#E2E8F0',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  tagline: 'PUT ORDER IN YOUR DAY',
} as const;

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EDE9FE',
    card: '#FFFFFF',
    input: '#F1F5F9',
    border: '#E2E8F0',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    aiAccent: '#8B5CF6',
    onPrimary: '#000000',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    tabBar: '#FFFFFF',
    overlay: '#000000',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    background: '#000000',
    backgroundElement: '#1C1C1E',
    backgroundSelected: '#2C2C2E',
    card: '#1C1C1E',
    input: '#1C1C1E',
    border: '#2C2C2E',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    aiAccent: '#8B5CF6',
    onPrimary: '#000000',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    tabBar: '#000000',
    overlay: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorSchemeName = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

export const Fonts = Platform.select({
  ios: {
    sans: 'Poppins_400Regular',
    serif: 'ui-serif',
    rounded: 'Poppins_500Medium',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Poppins_400Regular',
    serif: 'serif',
    rounded: 'Poppins_500Medium',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const THEME_PREFERENCE_KEY = 'ordina.themePreference';
