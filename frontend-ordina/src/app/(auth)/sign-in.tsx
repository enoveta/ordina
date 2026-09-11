import { Link } from 'expo-router';
import { href } from '@/utils/href';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField } from '@/components/auth-field';
import { BrandLockup } from '@/components/brand-lockup';
import { PrimaryButton } from '@/components/primary-button';
import { SocialAuthButtons } from '@/components/social-auth-buttons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';
import { routeAfterAuth } from '@/utils/after-auth';

export default function SignInScreen() {
  const theme = useTheme();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Sign in', 'Enter your email and password.');
      return;
    }

    try {
      await signIn({
        email: email.trim(),
        password,
      });
      routeAfterAuth();
    } catch (error: any) {
      Alert.alert('Sign in failed', error?.response?.data?.message ?? 'Unable to reach the server. Check your network connection.');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BrandLockup markSize={108} wordmarkSize="md" />

          <View style={styles.heading}>
            <ThemedText style={styles.title}>Welcome back</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Sign in to continue
            </ThemedText>
          </View>

          <AuthField
            label="Email Address"
            placeholder="sarah.jones@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <AuthField
            label="Password"
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={setPassword}
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

          <SocialAuthButtons />

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
  heading: { gap: 4, marginTop: 12, marginBottom: 4 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold' },
  subtitle: { fontSize: 14 },
  forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 4 },
  link: { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  line: { flex: 1, height: 1 },
  or: { fontSize: 12 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
});
