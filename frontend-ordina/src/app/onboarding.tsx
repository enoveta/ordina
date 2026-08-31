import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { href } from '@/utils/href';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';

const SLIDES = [
  {
    icon: 'checkbox-outline' as const,
    title: 'Organize everything',
    body: 'Keep your tasks, schedules and goals in one place.',
  },
  {
    icon: 'chatbubble-ellipses-outline' as const,
    title: 'Talk to ORDINA',
    body: 'Speak or type naturally and let ORDINA organize your activities.',
  },
  {
    icon: 'radio-button-on-outline' as const,
    title: 'Stay on track',
    body: 'Get reminders, manage priorities and understand your productivity.',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const completeWelcome = useAuthStore((s) => s.completeWelcome);
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  async function finish() {
    await completeWelcome();
    router.push(href('/profile-setup'));
  }

  async function skip() {
    await completeWelcome();
    router.push(href('/profile-setup'));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.top}>
        <BackButton fallback="/welcome" />
        <Pressable onPress={() => void skip()}>
          <ThemedText style={{ color: theme.primary }}>Skip</ThemedText>
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name={slide.icon} size={42} color={theme.primary} />
        </View>
        <ThemedText style={styles.title}>{slide.title}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.body}>
          {slide.body}
        </ThemedText>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              i === index ? styles.dotActive : styles.dot,
              { backgroundColor: i === index ? theme.primary : theme.border },
            ]}
          />
        ))}
      </View>

      {last ? (
        <PrimaryButton label="Get Started" onPress={() => void finish()} />
      ) : (
        <View style={styles.row}>
          <Pressable
            onPress={() => void skip()}
            style={[styles.ghost, { borderColor: theme.primary }]}>
            <ThemedText style={{ color: theme.primary }}>Skip</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setIndex((v) => v + 1)}
            style={[styles.next, { backgroundColor: theme.primary }]}>
            <ThemedText style={{ color: theme.onPrimary, fontFamily: 'Poppins_700Bold' }}>Next</ThemedText>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 24, paddingBottom: 20 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  body: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 22, height: 8, borderRadius: 4 },
  row: { flexDirection: 'row', gap: 12 },
  ghost: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  next: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
