import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { href } from '@/utils/href';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';
import { useTasksStore, type Task } from '@/store/tasks-store';

type TabKey = 'today' | 'upcoming' | 'completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

function priorityStyle(priority: Task['priority']) {
  if (priority === 'high') return { bg: '#FEE2E2', color: '#DC2626', label: 'High' };
  if (priority === 'medium') return { bg: '#FEF3C7', color: '#D97706', label: 'Medium' };
  return { bg: '#DCFCE7', color: '#16A34A', label: 'Low' };
}

function categoryIcon(category: Task['category']) {
  switch (category) {
    case 'work':
      return 'briefcase-outline';
    case 'learning':
    case 'design':
    case 'database':
      return 'book-outline';
    case 'health':
      return 'barbell-outline';
    default:
      return 'person-outline';
  }
}

export default function TasksScreen() {
  const theme = useTheme();
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const { tasks, load, toggleComplete } = useTasksStore();
  const [tab, setTab] = useState<TabKey>('today');

  useEffect(() => {
    if (isSignedIn) void load();
  }, [isSignedIn, load]);

  const today = new Date().toISOString().split('T')[0];
  const visible = useMemo(() => {
    if (tab === 'completed') return tasks.filter((t) => t.completed);
    if (tab === 'today') return tasks.filter((t) => t.dueDate === today && !t.completed);
    return tasks.filter((t) => t.dueDate && t.dueDate > today && !t.completed);
  }, [tasks, tab, today]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>My Tasks</ThemedText>
        <Pressable
          onPress={() => router.push(href('/new-task'))}
          style={[styles.add, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={18} color={theme.onPrimary} />
          <ThemedText style={{ color: theme.onPrimary, fontFamily: 'Poppins_600SemiBold' }}>Add</ThemedText>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.primary : theme.card,
                  borderColor: theme.primary,
                },
              ]}>
              <ThemedText style={{ color: active ? theme.onPrimary : theme.primary }}>{item.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {visible.map((task) => {
          const p = priorityStyle(task.priority);
          return (
            <View key={task.id} style={[styles.card, { backgroundColor: theme.card }]}>
              <Pressable
                onPress={() => void toggleComplete(task.id)}
                style={[
                  styles.box,
                  {
                    borderColor: task.completed ? theme.primary : theme.border,
                    backgroundColor: task.completed ? theme.primary : 'transparent',
                  },
                ]}>
                {task.completed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
              </Pressable>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.cardTitle, task.completed && styles.strike]}>{task.title}</ThemedText>
                <View style={styles.meta}>
                  <View style={[styles.pill, { backgroundColor: p.bg }]}>
                    <ThemedText style={{ color: p.color, fontSize: 11 }}>{p.label}</ThemedText>
                  </View>
                  <ThemedText themeColor="textSecondary" style={styles.metaText}>
                    {task.dueDate === today ? 'Today' : task.dueDate}
                    {task.startTime ? ` - ${task.startTime}` : ''}
                  </ThemedText>
                  <Ionicons name={categoryIcon(task.category) as never} size={14} color={theme.textSecondary} />
                  <ThemedText themeColor="textSecondary" style={styles.metaText}>
                    {task.category}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })}
        {visible.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            No tasks here yet. Tap Add to create one — it is saved in your account.
          </ThemedText>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold' },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 16 },
  tab: { flex: 1, borderWidth: 1, borderRadius: 20, paddingVertical: 10, alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 120, gap: 10 },
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  strike: { textDecorationLine: 'line-through', opacity: 0.5 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  pill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  metaText: { fontSize: 12, textTransform: 'capitalize' },
  empty: { textAlign: 'center', marginTop: 40 },
});
