import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useProductivityStore } from '@/store/productivity-store';

export default function RemindersScreen() {
  const theme = useTheme(); const { reminders, loadReminders, addReminder, completeReminder, deleteReminder } = useProductivityStore();
  const [title, setTitle] = useState(''); const [remindAt, setRemindAt] = useState('');
  useEffect(() => { void loadReminders(); }, [loadReminders]);
  async function create() { if (title.trim() && remindAt.trim()) { await addReminder({ title: title.trim(), remindAt }); setTitle(''); setRemindAt(''); } }
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={styles.header}><ThemedText style={styles.title}>Reminders</ThemedText><Pressable onPress={() => router.back()}><ThemedText>Close</ThemedText></Pressable></View><View style={styles.create}><TextInput value={title} onChangeText={setTitle} placeholder="Reminder title" placeholderTextColor={theme.textSecondary} style={[styles.input, { backgroundColor: theme.input, color: theme.text }]} /><TextInput value={remindAt} onChangeText={setRemindAt} placeholder="2026-09-02T18:00:00Z" placeholderTextColor={theme.textSecondary} style={[styles.input, { backgroundColor: theme.input, color: theme.text }]} /><PrimaryButton label="Add Reminder" onPress={() => void create()} /></View><ScrollView contentContainerStyle={styles.list}>{reminders.map((reminder) => <View key={reminder.id} style={[styles.row, { backgroundColor: theme.card }]}><Pressable onPress={() => void completeReminder(reminder.id, !reminder.completed)} style={{ flex: 1 }}><ThemedText style={reminder.completed ? styles.done : undefined}>{reminder.title}</ThemedText><ThemedText themeColor="textSecondary">{new Date(reminder.remindAt).toLocaleString()}</ThemedText></Pressable><Pressable onPress={() => void deleteReminder(reminder.id)}><ThemedText style={{ color: theme.danger }}>Delete</ThemedText></Pressable></View>)}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 }, title: { fontSize: 24, fontFamily: 'Poppins_700Bold' }, create: { padding: 16, gap: 10 }, input: { borderRadius: 10, padding: 14 }, list: { padding: 16, gap: 10 }, row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12 }, done: { textDecorationLine: 'line-through', opacity: 0.5 } });
