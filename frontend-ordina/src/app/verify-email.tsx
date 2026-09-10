import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { apiMessage } from '@/services/api';
import { useAuthStore } from '@/store/auth-store';

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const confirmEmail = useAuthStore((state) => state.confirmEmail);
  const [code, setCode] = useState(params.code || '');

  async function verify() {
    if (!params.email || !/^\d{6}$/.test(code)) {
      Alert.alert('Confirm email', 'Enter the 6-digit confirmation code.');
      return;
    }
    try {
      await confirmEmail(params.email, code);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Confirm email', apiMessage(error));
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Confirm your email</ThemedText>
        <ThemedText themeColor="textSecondary">Enter the code sent to {params.email || 'your email'}.</ThemedText>
        <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="123456" style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
        <PrimaryButton label="Confirm email" onPress={() => void verify()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 24, gap: 16 }, title: { fontSize: 28, fontFamily: 'Poppins_700Bold' }, input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 22, letterSpacing: 6 } });