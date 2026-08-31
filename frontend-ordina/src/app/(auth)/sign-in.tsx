import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { href } from '@/utils/href';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField } from '@/components/auth-field';
import { BrandLockup } from '@/components/brand-lockup';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';

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
    await signIn({
      name: email.split('@')[0] || 'Sarah',
      email: email.trim(),
    });
    router.replace(href('/(tabs)'));
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

          <View style={styles.socialRow}>
            <Pressable
              style={[styles.social, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() =>
                Alert.alert('Google', 'Google sign-in will connect when account services are configured.')
              }>
              <Ionicons name="logo-google" size={18} color={theme.text} />
              <ThemedText style={styles.socialLabel}>Google</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.social, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() =>
                Alert.alert('Apple', 'Apple sign-in will connect when account services are configured.')
              }>
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
