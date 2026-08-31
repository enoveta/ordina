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

const USER_PROMPT =
  'Tomorrow I need to finish my React project, study PostgreSQL for two hours, call John at 4 PM, and go to the gym in the evening. Schedule these for me.';

const PROPOSED = [
  { time: '9:00 AM - 11:00 AM', title: 'Finish React project', color: '#8B5CF6', category: 'Work' },
  { time: '11:00 AM - 1:00 PM', title: 'Study PostgreSQL', color: '#3B82F6', category: 'Education' },
  { time: '4:00 PM - 4:30 PM', title: 'Call John', color: '#F59E0B', category: 'Personal' },
  { time: '6:30 PM - 7:30 PM', title: 'Gym', color: '#22C55E', category: 'Health' },
];

export default function OrdinaAiScreen() {
  const theme = useTheme();
  const [draft, setDraft] = useState('');

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
        <View style={[styles.userBubble, { backgroundColor: theme.card }]}>
          <ThemedText style={styles.bubbleText}>{USER_PROMPT}</ThemedText>
        </View>

        <View style={styles.aiRow}>
          <Ionicons name="sparkles" size={16} color={theme.primary} />
          <ThemedText style={{ color: theme.primary, flex: 1 }}>
            I&apos;ve structured your schedule for tomorrow, August 28
          </ThemedText>
        </View>

        <View style={[styles.proposal, { backgroundColor: theme.card }]}>
          <ThemedText style={styles.proposalTitle}>Proposed August 28</ThemedText>
          {PROPOSED.map((item) => (
            <View key={item.title} style={styles.proposalItem}>
              <View style={[styles.bar, { backgroundColor: item.color }]} />
              <View style={{ flex: 1 }}>
                <ThemedText themeColor="textSecondary" style={styles.meta}>
                  {item.time}
                </ThemedText>
                <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
              </View>
            </View>
          ))}
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Confirm Schedule" onPress={() => router.push(href('/schedule-created'))} />
            </View>
            <Pressable style={[styles.edit, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText>Edit</ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask ORDINA to change anything..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
        <Pressable style={[styles.mic, { backgroundColor: theme.primary }]}>
          <Ionicons name="mic" size={18} color={theme.onPrimary} />
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
