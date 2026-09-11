import Ionicons from '@expo/vector-icons/Ionicons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';
import { routeAfterAuth } from '@/utils/after-auth';

WebBrowser.maybeCompleteAuthSession();

export function SocialAuthButtons() {
  const theme = useTheme();
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientId || '000000000000-placeholder.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') {
        Alert.alert('Google', response.error?.message || 'Google sign-in was cancelled or failed.');
      }
      return;
    }
    const idToken = response.params.id_token || response.authentication?.idToken;
    if (!idToken) {
      Alert.alert('Google', 'Google did not return an ID token.');
      return;
    }
    void useAuthStore
      .getState()
      .signInWithGoogle(idToken)
      .then(() => routeAfterAuth())
      .catch((error: any) => {
        Alert.alert('Google', error?.response?.data?.message || error?.message || 'Google sign-in failed.');
      });
  }, [response]);

  async function onGoogle() {
    if (!googleClientId) {
      Alert.alert(
        'Google',
        'Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in frontend-ordina/.env and the same value as GOOGLE_CLIENT_ID on the API.',
      );
      return;
    }
    await promptAsync();
  }

  async function onApple() {
    if (Platform.OS !== 'ios') {
      Alert.alert('Apple', 'Sign in with Apple is available on iOS only.');
      return;
    }
    const AppleAuthentication = await import('expo-apple-authentication');
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      Alert.alert('Apple', 'Sign in with Apple is not available on this device.');
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        Alert.alert('Apple', 'Apple did not return an identity token.');
        return;
      }
      await useAuthStore.getState().signInWithApple({
        identityToken: credential.identityToken,
        fullName: credential.fullName,
      });
      routeAfterAuth();
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple', error?.response?.data?.message || error?.message || 'Apple sign-in failed.');
    }
  }

  return (
    <View style={styles.socialRow}>
      <Pressable
        disabled={!request && Boolean(googleClientId)}
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
  );
}

const styles = StyleSheet.create({
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
});
