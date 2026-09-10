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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  async function onCreate() {
    if (!username.trim() || !name.trim() || !email.trim() || !pin) {
      Alert.alert('Create Account', 'Fill in username, name, email, and your 4-digit PIN.');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      Alert.alert('Create Account', 'PIN must contain exactly 4 numbers.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Create Account', 'PINs do not match.');
      return;
    }
    try {
      setDraft({ username: username.trim(), name: name.trim() });
      const result = await signUp(username.trim(), email.trim(), pin);
      router.push({ pathname: '/verify-email', params: { email: result.email, code: result.verificationCode || '' } });
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
          <AuthField label="Username" placeholder="sarah_jones" autoCapitalize="none" value={username} onChangeText={setUsername} />
          <AuthField
            label="Email Address"
            placeholder="sarah.jones@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <AuthField label="4-digit PIN" placeholder="1234" isPassword keyboardType="number-pad" value={pin} onChangeText={setPin} />
          <AuthField
            label="Confirm PIN"
            placeholder="1234"
            isPassword
            keyboardType="number-pad"
            value={confirmPin}
            onChangeText={setConfirmPin}
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
