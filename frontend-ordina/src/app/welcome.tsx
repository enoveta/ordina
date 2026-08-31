import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { href } from '@/utils/href';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLockup } from '@/components/brand-lockup';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAppTheme } from '@/providers/theme-provider';
import { useAuthStore } from '@/store/auth-store';

const CHIPS = ['AI-powered', 'Smart scheduling', 'Voice & text'];

export default function WelcomeScreen() {
  const theme = useTheme();
  const { scheme, setPreference } = useAppTheme();
  const completeWelcome = useAuthStore((s) => s.completeWelcome);

  async function startOnboarding() {
    await completeWelcome();
    router.push(href('/onboarding'));
  }

  async function goSignIn() {
    await completeWelcome();
    router.push(href('/sign-in'));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.top}>
        <View style={{ width: 40 }} />
        <Pressable
          onPress={() => setPreference(scheme === 'dark' ? 'light' : 'dark')}
          style={[styles.moon, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name={scheme === 'dark' ? 'sunny' : 'moon'} size={18} color="#F59E0B" />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={[styles.iconTile, { backgroundColor: scheme === 'dark' ? '#111111' : '#111111' }]}>
          <BrandLockup markSize={92} wordmarkSize="sm" onBlack />
        </View>
        <ThemedText style={styles.brand}>
          ORDIN
          <ThemedText style={[styles.brand, { color: theme.primary }]}>A</ThemedText>
        </ThemedText>
        <ThemedText style={styles.headline}>Put your day in order.</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.sub}>
          Your intelligent personal productivity assistant.
        </ThemedText>
        <View style={styles.chips}>
          {CHIPS.map((chip) => (
            <View key={chip} style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={{ color: theme.primary, fontSize: 12 }}>{chip}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <PrimaryButton glow label="Get Started" onPress={() => void startOnboarding()} />
        <Pressable onPress={() => void goSignIn()} style={styles.signInRow}>
          <ThemedText themeColor="textSecondary">Already have an account? </ThemedText>
          <ThemedText style={{ color: theme.primary, fontFamily: 'Poppins_600SemiBold' }}>Sign In</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 24 },
  top: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 },
  moon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  iconTile: {
    borderRadius: 28,
    padding: 16,
    marginBottom: 8,
  },
  brand: { fontSize: 36, fontFamily: 'Poppins_700Bold' },
  headline: { fontSize: 22, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  sub: { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  bottom: { paddingBottom: 20, gap: 14 },
  signInRow: { flexDirection: 'row', justifyContent: 'center' },
});
