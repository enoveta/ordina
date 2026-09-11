import { router } from 'expo-router';
import { href } from '@/utils/href';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingArt } from '@/components/onboarding-art';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';

export default function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  async function go(path: '/sign-in' | '/sign-up') {
    await completeOnboarding();
    router.replace(href(path));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <OnboardingArt />
      <View style={styles.copy}>
        <ThemedText style={styles.headline}>Tell ORDINA what you need to do</ThemedText>
        <ThemedText style={[styles.subhead, { color: theme.primary }]}>Put order in your day</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.body}>
          Speak or type naturally. ORDINA understands your plans, organizes your tasks, and schedules
          your day with beautiful precision.
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <PrimaryButton glow label="Get Started" onPress={() => void go('/sign-up')} />
        <Pressable onPress={() => void go('/sign-in')} style={styles.skip}>
          <ThemedText themeColor="textSecondary" style={styles.skipText}>
            Skip intro
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: 24,
  },
  copy: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 28,
    gap: 8,
  },
  headline: {
    fontSize: 34,
    lineHeight: 42,
    fontFamily: 'Poppins_700Bold',
  },
  subhead: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 8,
    maxWidth: 340,
  },
  actions: {
    paddingBottom: 20,
    gap: 16,
  },
  skip: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 14,
  },
});
