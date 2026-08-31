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

export default function SignUpScreen() {
  const theme = useTheme();
  const signUp = useAuthStore((s) => s.signUp);
  const setDraft = useAuthStore((s) => s.setDraft);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  async function onCreate() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Create Account', 'Fill in name, email, and password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Create Account', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Create Account', 'Passwords do not match.');
      return;
    }
    try {
      setDraft({ name: name.trim() });
      await signUp(email.trim(), password);
      router.replace(href('/(tabs)'));
    } catch (error) {
      Alert.alert('Create Account', apiMessage(error));
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={{ alignSelf: 'flex-start' }}>
            <BackButton fallback="/sign-in" />
          </View>
          <BrandLockup markSize={88} wordmarkSize="sm" />

          <View style={styles.heading}>
            <ThemedText style={styles.title}>Create Account</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Start organizing your day
            </ThemedText>
          </View>

          <AuthField label="Full Name" placeholder="Sarah Jones" value={name} onChangeText={setName} />
          <AuthField
            label="Email Address"
            placeholder="sarah.jones@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <AuthField label="Password" placeholder="••••••••" isPassword value={password} onChangeText={setPassword} />
          <AuthField
            label="Confirm Password"
            placeholder="••••••••"
            isPassword
            value={confirm}
            onChangeText={setConfirm}
          />

          <PrimaryButton label="Create Account" onPress={() => void onCreate()} />

          <View style={styles.dividerRow}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <ThemedText themeColor="textSecondary" style={styles.or}>
              or sign up with
            </ThemedText>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.socialRow}>
            <Pressable
              style={[styles.social, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() =>
                Alert.alert('Google', 'Google sign-up will connect when account services are configured.')
              }>
              <Ionicons name="logo-google" size={18} color={theme.text} />
              <ThemedText style={styles.socialLabel}>Google</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.social, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() =>
                Alert.alert('Apple', 'Apple sign-up will connect when account services are configured.')
              }>
              <Ionicons name="logo-apple" size={20} color={theme.text} />
              <ThemedText style={styles.socialLabel}>Apple</ThemedText>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary">Already have an account? </ThemedText>
            <Link href={href('/sign-in')}>
              <ThemedText style={[styles.link, { color: theme.primary }]}>Sign In</ThemedText>
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
    paddingTop: 4,
    paddingBottom: 28,
    gap: 12,
    flexGrow: 1,
  },
  heading: { gap: 4, marginTop: 8, marginBottom: 2 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold' },
  subtitle: { fontSize: 14 },
  link: { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
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
    paddingTop: 16,
  },
});
