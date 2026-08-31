import { router } from 'expo-router';
import { href } from '@/utils/href';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandLockup } from '@/components/brand-lockup';

import { useAuthStore } from '@/store/auth-store';

export default function SplashScreen() {
  const { hydrated, hasSeenOnboarding, isSignedIn } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      if (!hasSeenOnboarding) {
        router.replace(href('/onboarding'));
        return;
      }
      if (!isSignedIn) {
        router.replace(href('/sign-in'));
        return;
      }
      router.replace(href('/(tabs)'));
    }, 1800);
    return () => clearTimeout(timer);
  }, [hydrated, hasSeenOnboarding, isSignedIn]);

  return (
    <View style={styles.screen}>
      <BrandLockup markSize={168} wordmarkSize="lg" onBlack />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
});
