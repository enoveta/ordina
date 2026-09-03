import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { href } from '@/utils/href';
import { api } from '@/services/api';
import { useTasksStore } from '@/store/tasks-store';

type Suggestion = { title: string; category: 'work' | 'personal' | 'health' | 'learning' | 'design' | 'database'; startTime: string; duration: string };

export default function OrdinaAiScreen() {
  const theme = useTheme();
  const addTask = useTasksStore((state) => state.addTask);
  const [draft, setDraft] = useState('');
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [answer, setAnswer] = useState('Tell me what you want to schedule and I will turn it into tasks.');
  const [loading, setLoading] = useState(false);

  async function askAssistant() {
    const request = draft.trim();
    if (!request || loading) return;
    setPrompt(request);
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/schedule', { prompt: request });
      setSuggestions(data.suggestions ?? []);
      setAnswer(data.message ?? 'Here is a schedule based on your request.');
      setDraft('');
    } catch {
      setAnswer('I could not reach the assistant. Check that the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSchedule() {
    const dueDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    for (const suggestion of suggestions) {
      await addTask({ title: suggestion.title, description: 'Created by ORDINA Assistant', status: 'todo', priority: 'medium', category: suggestion.category, dueDate, startTime: suggestion.startTime, duration: suggestion.duration, completed: false });
    }
    router.push(href('/schedule-created'));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="close" size={20} color={theme.text} />
        </Pressable>
        <Image source={require('@/assets/images/ordina-logo.png')} style={styles.logo} contentFit="contain" />
        <View style={[styles.pill, { backgroundColor: theme.card }]}>
          <ThemedText style={{ color: theme.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>
            ORDINA AI
          </ThemedText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.chat} keyboardShouldPersistTaps="handled">
        {prompt ? <View style={[styles.userBubble, { backgroundColor: theme.card }]}><ThemedText style={styles.bubbleText}>{prompt}</ThemedText></View> : null}

        <View style={styles.aiRow}>
          <Ionicons name="sparkles" size={16} color={theme.primary} />
          <ThemedText style={{ color: theme.primary, flex: 1 }}>{answer}</ThemedText>
        </View>

        {suggestions.length > 0 ? <View style={[styles.proposal, { backgroundColor: theme.card }]}>
          <ThemedText style={styles.proposalTitle}>Suggested schedule</ThemedText>
          {suggestions.map((item) => (
            <View key={item.title} style={styles.proposalItem}>
              <View style={[styles.bar, { backgroundColor: theme.primary }]} />
              <View style={{ flex: 1 }}>
                <ThemedText themeColor="textSecondary" style={styles.meta}>
                  {item.startTime} · {item.duration}
                </ThemedText>
                <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
              </View>
            </View>
          ))}
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Save Tasks" onPress={() => void confirmSchedule()} />
            </View>
            <Pressable style={[styles.edit, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText>Edit</ThemedText>
            </Pressable>
          </View>
        </View> : null}
      </ScrollView>

      <View style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask ORDINA to change anything..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
        <Pressable onPress={() => void askAssistant()} style={[styles.mic, { backgroundColor: theme.primary, opacity: loading ? 0.5 : 1 }]}>
          <Ionicons name="send" size={18} color={theme.onPrimary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 40, height: 40 },
  pill: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chat: { padding: 16, gap: 16, paddingBottom: 24 },
  userBubble: { alignSelf: 'flex-end', maxWidth: '88%', borderRadius: 16, padding: 14 },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  aiRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  proposal: { borderRadius: 16, padding: 16, gap: 12 },
  proposalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  proposalItem: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  bar: { width: 4, height: 40, borderRadius: 2 },
  meta: { fontSize: 12 },
  itemTitle: { fontFamily: 'Poppins_500Medium' },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  edit: { borderRadius: Radii.full, paddingHorizontal: 18, paddingVertical: 16 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    borderRadius: 28,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    gap: 8,
  },
  input: { flex: 1, fontFamily: 'Poppins_400Regular', paddingVertical: 14 },
  mic: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
