import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { apiMessage } from '@/services/api';
import { useAuthStore } from '@/store/auth-store';

export default function UnlockScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const unlock = useAuthStore((state) => state.unlock);
  const [pin, setPin] = useState('');

  async function openApp() {
    if (!/^\d{4}$/.test(pin)) {
      Alert.alert('Unlock ORDINA', 'Enter your 4-digit PIN.');
      return;
    }
    try {
      await unlock(pin);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Unlock ORDINA', apiMessage(error));
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Welcome back{user?.name ? `, ${user.name}` : ''}</ThemedText>
        <ThemedText themeColor="textSecondary">Enter your 4-digit PIN to open your personal ORDINA.</ThemedText>
        <TextInput value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={4} secureTextEntry placeholder="1234" style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
        <PrimaryButton label="Open ORDINA" onPress={() => void openApp()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 24, gap: 16 }, title: { fontSize: 28, fontFamily: 'Poppins_700Bold' }, input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 24, letterSpacing: 8 } });