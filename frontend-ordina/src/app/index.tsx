import { router } from 'expo-router';
import { href } from '@/utils/href';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandLockup } from '@/components/brand-lockup';
import { useAuthStore } from '@/store/auth-store';

export default function SplashScreen() {
  const { hydrated, hasSeenWelcome, hasCompletedQuestions, isSignedIn } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      if (isSignedIn) {
        router.replace(href('/(tabs)'));
        return;
      }
      if (!hasSeenWelcome) {
        router.replace(href('/welcome'));
        return;
      }
      if (!hasCompletedQuestions) {
        router.replace(href('/profile-setup'));
        return;
      }
      router.replace(href('/sign-in'));
    }, 1400);
    return () => clearTimeout(timer);
  }, [hydrated, hasSeenWelcome, hasCompletedQuestions, isSignedIn]);

  return (
    <View style={styles.screen}>
      <BrandLockup markSize={160} wordmarkSize="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F4FF',
  },
});
