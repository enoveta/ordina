import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, Platform, useColorScheme as useSystemColorScheme } from 'react-native';

import { Colors, THEME_PREFERENCE_KEY, type ColorSchemeName, type ThemePreference } from '@/constants/theme';

type ThemeContextValue = {
  preference: ThemePreference;
  scheme: ColorSchemeName;
  colors: (typeof Colors)[ColorSchemeName];
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function readPreference(): Promise<ThemePreference | null> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return (localStorage.getItem(THEME_PREFERENCE_KEY) as ThemePreference | null) ?? null;
    }
    return (await SecureStore.getItemAsync(THEME_PREFERENCE_KEY)) as ThemePreference | null;
  } catch {
    return null;
  }
}

async function writePreference(preference: ThemePreference) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_PREFERENCE_KEY, preference);
      return;
    }
    await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, preference);
  } catch {
    // Persistence is optional during Phase 1; the in-memory preference still applies.
  }
}

function resolveScheme(preference: ThemePreference, system: string | null | undefined): ColorSchemeName {
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');

  useEffect(() => {
    readPreference().then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void writePreference(next);
  }, []);

  const scheme = resolveScheme(preference, systemScheme);
  const colors = Colors[scheme];

  const value = useMemo(
    () => ({ preference, scheme, colors, setPreference }),
    [preference, scheme, colors, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    const system = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
    return {
      preference: 'light' as ThemePreference,
      scheme: 'light' as ColorSchemeName,
      colors: Colors.light,
      setPreference: () => {},
    };
  }
  return context;
}
