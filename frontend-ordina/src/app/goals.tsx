import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useProductivityStore } from '@/store/productivity-store';

export default function GoalsScreen() {
  const theme = useTheme(); const { goals, loadGoals, addGoal, completeGoal, deleteGoal } = useProductivityStore();
  const [title, setTitle] = useState('');
  useEffect(() => { void loadGoals(); }, [loadGoals]);
  async function create() { if (title.trim()) { await addGoal({ title: title.trim() }); setTitle(''); } }
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={styles.header}><ThemedText style={styles.title}>Goals</ThemedText><Pressable onPress={() => router.back()}><ThemedText>Close</ThemedText></Pressable></View><View style={styles.create}><TextInput value={title} onChangeText={setTitle} placeholder="Add a goal" placeholderTextColor={theme.textSecondary} style={[styles.input, { backgroundColor: theme.input, color: theme.text }]} /><PrimaryButton label="Add Goal" onPress={() => void create()} /></View><ScrollView contentContainerStyle={styles.list}>{goals.map((goal) => <View key={goal.id} style={[styles.row, { backgroundColor: theme.card }]}><Pressable onPress={() => void completeGoal(goal.id, !goal.completed)} style={{ flex: 1 }}><ThemedText style={goal.completed ? styles.done : undefined}>{goal.title}</ThemedText><ThemedText themeColor="textSecondary">{goal.completed ? 'Completed' : 'In progress'}</ThemedText></Pressable><Pressable onPress={() => void deleteGoal(goal.id)}><ThemedText style={{ color: theme.danger }}>Delete</ThemedText></Pressable></View>)}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 }, title: { fontSize: 24, fontFamily: 'Poppins_700Bold' }, create: { padding: 16, gap: 10 }, input: { borderRadius: 10, padding: 14 }, list: { padding: 16, gap: 10 }, row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12 }, done: { textDecorationLine: 'line-through', opacity: 0.5 } });
