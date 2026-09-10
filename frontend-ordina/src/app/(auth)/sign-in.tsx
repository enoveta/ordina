import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { href } from '@/utils/href';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { AuthField } from '@/components/auth-field';
import { BrandLockup } from '@/components/brand-lockup';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { apiMessage } from '@/services/api';
import { useAuthStore } from '@/store/auth-store';

export default function SignInScreen() {
  const theme = useTheme();
  const signIn = useAuthStore((s) => s.signIn);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);
  const signInApple = useAuthStore((s) => s.signInApple);
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');

  async function onSignIn() {
    if (!identifier.trim() || !pin) {
      Alert.alert('Sign in', 'Enter your username or email and 4-digit PIN.');
      return;
    }
    try {
      await signIn(identifier.trim(), pin);
      router.replace(href('/(tabs)'));
    } catch (error) {
      Alert.alert('Sign in', apiMessage(error));
    }
  }

  async function onGoogle() {
    try {
      await signInGoogle('');
      router.replace(href('/(tabs)'));
    } catch (error) {
      Alert.alert(
        'Continue with Google',
        `${apiMessage(error)}\n\nThe /api/auth/google endpoint is live. Add GOOGLE_CLIENT_ID on the server and a Google ID token from the app to complete sign-in.`
      );
    }
  }

  async function onApple() {
    try {
      await signInApple('');
      router.replace(href('/(tabs)'));
    } catch (error) {
      Alert.alert(
        'Continue with Apple',
        `${apiMessage(error)}\n\nThe /api/auth/apple endpoint is live. Add APPLE_CLIENT_ID on the server and an Apple identity token from the app to complete sign-in.`
      );
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <BackButton fallback="/welcome" />
          </View>
          <BrandLockup markSize={108} wordmarkSize="md" />

          <View style={styles.heading}>
            <ThemedText style={styles.title}>Welcome back</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Sign in to continue
            </ThemedText>
          </View>

          <AuthField
            label="Username or Email"
            placeholder="sarah_jones or email@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <AuthField
            label="4-digit PIN"
            placeholder="1234"
            isPassword
            keyboardType="number-pad"
            value={pin}
            onChangeText={setPin}
          />
          <Link href={href('/forgot-password')} asChild>
            <Pressable style={styles.forgot}>
              <ThemedText style={[styles.link, { color: theme.primary }]}>Forgot Password?</ThemedText>
            </Pressable>
          </Link>

          <PrimaryButton label="Sign In" onPress={() => void onSignIn()} />

          <View style={styles.dividerRow}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <ThemedText themeColor="textSecondary" style={styles.or}>
              or continue with
            </ThemedText>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.socialRow}>
            <Pressable
              style={[styles.social, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => void onGoogle()}>
              <Ionicons name="logo-google" size={18} color={theme.text} />
              <ThemedText style={styles.socialLabel}>Google</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.social, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => void onApple()}>
              <Ionicons name="logo-apple" size={20} color={theme.text} />
              <ThemedText style={styles.socialLabel}>Apple</ThemedText>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary">Don&apos;t have an account? </ThemedText>
            <Link href={href('/sign-up')}>
              <ThemedText style={[styles.link, { color: theme.primary }]}>Sign Up</ThemedText>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 14,
    flexGrow: 1,
  },
  topRow: { alignSelf: 'flex-start' },
  heading: { gap: 4, marginTop: 12, marginBottom: 4 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold' },
  subtitle: { fontSize: 14 },
  forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 4 },
  link: { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  line: { flex: 1, height: 1 },
  or: { fontSize: 12 },
  socialRow: { flexDirection: 'row', gap: 12 },
  social: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  socialLabel: { fontFamily: 'Poppins_500Medium' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
});
