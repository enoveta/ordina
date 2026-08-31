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
          Enter the email on your account. Password reset from the server will be added with authentication.
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
            Alert.alert('Reset password', 'Email delivery will work once the backend auth phase is connected.', [
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
