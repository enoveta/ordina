import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { apiMessage, sendAiMessage } from '@/services/api';

const QUICK = [
  { label: 'What should I do now?', icon: 'search-outline' as const },
  { label: "I'm overwhelmed", icon: 'sad-outline' as const },
  { label: 'Plan my week', icon: 'calendar-outline' as const },
];

export default function AiTabScreen() {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [reply, setReply] = useState('Ask me to create, organize, or prioritize something.');
  const [busy, setBusy] = useState(false);

  async function send(message?: string) {
    const value = (message ?? text).trim();
    if (!value) return;
    setBusy(true);
    try {
      const data = await sendAiMessage(value);
      setReply(data.reply || data.message || 'ORDINA received your request.');
      setText('');
    } catch (error) {
      Alert.alert('ORDINA AI', apiMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={[styles.mark, { backgroundColor: theme.primary }]}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        </View>
        <View>
          <ThemedText style={[styles.brand, { color: theme.primary }]}>ORDINA AI</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.caption}>
            Tell me what you need to get done.
          </ThemedText>
        </View>
      </View>

      <View style={[styles.bubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Ionicons name="sparkles" size={14} color="#FFFFFF" />
        </View>
        <ThemedText style={{ flex: 1 }}>{reply}</ThemedText>
      </View>

      <ThemedText themeColor="textSecondary" style={styles.quickLabel}>
        Quick actions
      </ThemedText>
      <View style={styles.actions}>
        {QUICK.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => void send(item.label)}
            style={[styles.action, { backgroundColor: theme.card }]}>
            <Ionicons name={item.icon} size={18} color={theme.primary} />
            <ThemedText style={styles.actionText}>{item.label}</ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.micWrap}>
        <Pressable style={[styles.mic, { backgroundColor: theme.primary }]}>
          <Ionicons name="mic" size={32} color="#FFFFFF" />
        </Pressable>
        <ThemedText themeColor="textSecondary">Tap to speak</ThemedText>
      </View>

      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Tell ORDINA what you need..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
        />
        <Pressable
          disabled={busy}
          style={[styles.send, { backgroundColor: theme.primary, opacity: busy ? 0.6 : 1 }]}
          onPress={() => void send()}>
          <Ionicons name="send" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, marginBottom: 16 },
  mark: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: 'Poppins_700Bold', letterSpacing: 0.6 },
  caption: { fontSize: 12 },
  bubble: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { marginTop: 18, marginBottom: 8, fontSize: 12 },
  actions: { gap: 8 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 14,
  },
  actionText: { fontFamily: 'Poppins_500Medium' },
  micWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  mic: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
