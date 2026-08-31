import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ThemeProvider, useAppTheme } from '@/providers/theme-provider';
import { useAuthStore } from '@/store/auth-store';

function RootStack() {
  const { scheme, colors } = useAppTheme();

  return (
    <NavigationThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="search" />
        <Stack.Screen name="new-task" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="schedule-created" />
        <Stack.Screen name="project/[id]" />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
