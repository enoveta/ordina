import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField } from '@/components/auth-field';
import { BackButton } from '@/components/back-button';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { apiMessage, forgotPassword } from '@/services/api';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');

  async function onSend() {
    if (!email.trim()) {
      Alert.alert('Reset password', 'Enter the email on your account.');
      return;
    }
    try {
      const result = await forgotPassword(email.trim());
      Alert.alert('Reset password', result.message, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Reset password', apiMessage(error));
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <BackButton fallback="/sign-in" />
        <ThemedText style={styles.title}>Forgot Password?</ThemedText>
        <ThemedText themeColor="textSecondary">
          Enter the email on your account. We will send a reset link once email delivery is configured.
        </ThemedText>
        <AuthField
          label="Email Address"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <PrimaryButton label="Send reset link" onPress={() => void onSend()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold' },
});
