import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField } from '@/components/auth-field';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Forgot Password?</ThemedText>
        <ThemedText themeColor="textSecondary">
          Password reset email is not enabled in this build. Use the email and password you registered with, or create a new account.
        </ThemedText>
        <AuthField
          label="Email Address"
          placeholder="sarah.jones@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <PrimaryButton
          label="Send reset link"
          onPress={() =>
            Alert.alert('Reset password', 'Email reset is not configured. Sign in with your existing password or create a new account.', [
              { text: 'OK', onPress: () => router.back() },
            ])
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold' },
});
