import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmAiActions, fetchAiMessages, interpretInstruction, transcribeAudio } from '@/services/ai';
import { createCalendarEvents, matchingContacts, pickTaskImage } from '@/services/device-integrations';
import { useTasksStore } from '@/store/tasks-store';
import { href } from '@/utils/href';

type VoiceState = 'ready' | 'listening' | 'processing' | 'understanding' | 'confirmation' | 'completed' | 'error';

type ProposedTask = {
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  priority?: string;
  reminder?: boolean;
  conflictsWith?: string[];
  suggestedStartTime?: string;
};

type Recording = {
  stopAndUnloadAsync: () => Promise<unknown>;
  getURI: () => string | null;
};

export default function OrdinaAiScreen() {
  const theme = useTheme();
  const loadTasks = useTasksStore((s) => s.loadTasks);
  const [draft, setDraft] = useState('');
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [result, setResult] = useState<any>(null);
  const [voice, setVoice] = useState<VoiceState>('ready');
  const [recording, setRecording] = useState<Recording | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  useEffect(() => {
    void fetchAiMessages()
      .then((messages) => setHistory(messages.map((item: any) => ({ role: item.role, content: item.content }))))
      .catch(() => undefined);
  }, []);

  async function send(text: string) {
    const message = text.trim();
    if (!message) return;
    setVoice('understanding');
    setHistory((rows) => [...rows, { role: 'user', content: message }]);
    setDraft('');
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const contacts = await matchingContacts(message).catch(() => []);
      const data = await interpretInstruction({ message, timezone, contacts });
      setResult(data);
      setHistory((rows) => [...rows, { role: 'assistant', content: data.message || 'Here is what I understood.' }]);
      setVoice(data.tasks?.length || data.reschedule ? 'confirmation' : 'completed');
    } catch (error: any) {
      setVoice('error');
      Alert.alert('ORDINA AI', error?.response?.data?.message || error?.message || 'Unable to reach ORDINA AI.');
    }
  }

  async function confirm() {
    try {
      await confirmAiActions({ tasks: result?.tasks ?? [], reschedule: result?.reschedule });
      await createCalendarEvents(result?.tasks ?? []).catch(() => undefined);
      await loadTasks();
      setVoice('completed');
      setResult(null);
      router.push(href('/schedule-created'));
    } catch (error: any) {
      Alert.alert('Confirm', error?.response?.data?.message || 'Could not save those actions.');
    }
  }

  async function toggleVoice() {
    try {
      // Native audio is deferred until the Android development build is ready.
      if (Platform.OS === 'web' || Platform.OS === 'android') {
        Alert.alert('Voice', 'Voice capture will be enabled in the Android development build. Use the text box for now.');
        return;
      }
      if (recording) {
        setVoice('processing');
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        if (!uri) {
          setVoice('error');
          return;
        }
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        const text = await transcribeAudio(base64, 'audio/m4a');
        if (!text.trim()) {
          setVoice('error');
          Alert.alert('Voice', 'I could not hear any words. Please try speaking again.');
          return;
        }
        setDraft(text);
        setVoice('ready');
        await send(text);
        return;
      }
      const { Audio } = await import('expo-av');
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone', 'ORDINA needs the microphone to turn speech into tasks. You can enable it in Settings.');
        setVoice('error');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const next = new Audio.Recording();
      await next.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await next.startAsync();
      setRecording(next);
      setVoice('listening');
    } catch (error: any) {
      setVoice('error');
      Alert.alert('Voice', error?.message || 'Voice capture is unavailable on this device.');
    }
  }

  const tasks: ProposedTask[] = result?.tasks ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="close" size={20} color={theme.text} />
        </Pressable>
        <Image source={require('@/assets/images/ordina-logo.png')} style={styles.logo} contentFit="contain" />
        <View style={[styles.pill, { backgroundColor: theme.card }]}>
          <ThemedText style={{ color: theme.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>
            {voice.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.chat} keyboardShouldPersistTaps="handled">
        {history.slice(-8).map((item, index) => (
          <View
            key={`${item.role}-${index}`}
            style={[
              item.role === 'user' ? styles.userBubble : styles.aiBubble,
              { backgroundColor: theme.card },
            ]}>
            <ThemedText>{item.content}</ThemedText>
          </View>
        ))}

        {result?.plan ? (
          <View style={[styles.proposal, { backgroundColor: theme.card }]}>
            <ThemedText style={styles.proposalTitle}>If you feel overwhelmed</ThemedText>
            <ThemedText>High priority: {(result.plan.highPriority || []).map((t: any) => t.title).join(', ') || 'None'}</ThemedText>
            <ThemedText>Can wait: {(result.plan.canWait || []).map((t: any) => t.title).join(', ') || 'None'}</ThemedText>
          </View>
        ) : null}

        {result?.recommendation ? (
          <View style={[styles.proposal, { backgroundColor: theme.card }]}>
            <ThemedText style={styles.proposalTitle}>Do this now</ThemedText>
            <ThemedText>{result.recommendation.title}</ThemedText>
          </View>
        ) : null}

        {result?.reschedule ? (
          <View style={[styles.proposal, { backgroundColor: theme.card }]}>
            <ThemedText style={styles.proposalTitle}>Proposed reschedule</ThemedText>
            <ThemedText>
              Move to {result.reschedule.date} {result.reschedule.startTime}
            </ThemedText>
            <PrimaryButton label="Confirm reschedule" onPress={() => void confirm()} />
          </View>
        ) : null}

        {result?.clarification ? (
          <View style={[styles.proposal, { backgroundColor: theme.card }]}>
            <ThemedText style={styles.proposalTitle}>Need a bit more</ThemedText>
            <ThemedText>{result.clarification}</ThemedText>
          </View>
        ) : null}

        {tasks.length > 0 ? (
          <View style={[styles.proposal, { backgroundColor: theme.card }]}>
            <ThemedText style={styles.proposalTitle}>Confirm these actions</ThemedText>
            {tasks.map((item) => (
              <View key={item.title} style={styles.proposalItem}>
                <View style={[styles.bar, { backgroundColor: theme.primary }]} />
                <View style={{ flex: 1 }}>
                  <ThemedText themeColor="textSecondary">
                    {item.date} {item.startTime} {item.durationMinutes ? `· ${item.durationMinutes}m` : ''}
                  </ThemedText>
                  <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                  {item.conflictsWith?.length ? (
                    <ThemedText style={{ color: theme.warning }}>
                      Conflicts with {item.conflictsWith.join(', ')}. Proposed {item.startTime}.
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            ))}
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Confirm & save" onPress={() => void confirm()} />
              </View>
              <Pressable onPress={() => setResult(null)} style={[styles.edit, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText>Cancel</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.quick}>
        {['What should I do now?', "I'm overwhelmed", 'Plan my week'].map((label) => (
          <Pressable key={label} onPress={() => void send(label)} style={[styles.chip, { borderColor: theme.border }]}>
            <ThemedText style={{ fontSize: 12 }}>{label}</ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Tell ORDINA what you need..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
        {attachmentName ? <ThemedText style={{ fontSize: 10, maxWidth: 48 }} numberOfLines={1}>{attachmentName}</ThemedText> : null}
        <Pressable
          onPress={() => {
            void pickTaskImage().then((asset) => {
              if (asset) setAttachmentName(asset.fileName || 'Selected image');
            });
          }}
          style={[styles.mic, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="image-outline" size={16} color={theme.text} />
        </Pressable>
        <Pressable onPress={() => void toggleVoice()} style={[styles.mic, { backgroundColor: theme.secondary }]}>
          <Ionicons name={voice === 'listening' ? 'stop' : 'mic'} size={18} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={() => void send(draft)} style={[styles.mic, { backgroundColor: theme.primary }]}>
          <Ionicons name="send" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 40, height: 40 },
  pill: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chat: { padding: 16, gap: 12, paddingBottom: 24 },
  userBubble: { alignSelf: 'flex-end', maxWidth: '88%', borderRadius: 16, padding: 14 },
  aiBubble: { alignSelf: 'flex-start', maxWidth: '92%', borderRadius: 16, padding: 14 },
  proposal: { borderRadius: 16, padding: 16, gap: 12 },
  proposalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  proposalItem: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  bar: { width: 4, height: 40, borderRadius: 2 },
  itemTitle: { fontFamily: 'Poppins_500Medium' },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  edit: { borderRadius: Radii.full, paddingHorizontal: 18, paddingVertical: 16 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
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
