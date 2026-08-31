import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useTasksStore } from '@/store/tasks-store';

const RECENT = ['React', 'Gym', 'John', 'PostgreSQL'];

export default function SearchScreen() {
  const theme = useTheme();
  const { tasks, toggleComplete } = useTasksStore();
  const [query, setQuery] = useState('React');
  const [status, setStatus] = useState('In Progress');
  const [priority, setPriority] = useState('All');
  const [project, setProject] = useState('React Rebuild');

  const matches = useMemo(() => {
    const q = query.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, query]);

  function cycle(current: string, options: string[]) {
    return options[(options.indexOf(current) + 1) % options.length];
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.search, { borderColor: theme.primary, backgroundColor: theme.card }]}>
        <Ionicons name="search" size={18} color={theme.primary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder="Search"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
      </View>

      <ThemedText themeColor="textSecondary" style={styles.group}>
        RECENT SEARCHES
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {RECENT.map((item) => (
          <Pressable
            key={item}
            onPress={() => setQuery(item)}
            style={[styles.chip, { backgroundColor: theme.card }]}>
            <ThemedText>{item}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.filters}>
        <ThemedText style={styles.filterTitle}>QUICK FILTERS</ThemedText>
        {[
          { label: 'By Status', value: status, set: () => setStatus(cycle(status, ['In Progress', 'Completed', 'All'])) },
          { label: 'By Priority', value: priority, set: () => setPriority(cycle(priority, ['All', 'High', 'Medium', 'Low'])) },
          { label: 'By Project', value: project, set: () => setProject(cycle(project, ['React Rebuild', 'All'])) },
        ].map((row) => (
          <Pressable key={row.label} onPress={row.set} style={styles.filterRow}>
            <ThemedText>{row.label}</ThemedText>
            <View style={styles.filterValue}>
              <ThemedText style={{ color: theme.primary }}>{row.value}</ThemedText>
              <Ionicons name="chevron-down" size={16} color={theme.primary} />
            </View>
          </Pressable>
        ))}
      </View>

      <ThemedText themeColor="textSecondary" style={styles.group}>
        MATCHING TASKS ({matches.length})
      </ThemedText>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {matches.map((task) => (
          <View key={task.id} style={[styles.task, { backgroundColor: theme.card }]}>
            <Pressable
              onPress={() => toggleComplete(task.id)}
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
              <ThemedText style={task.completed ? styles.strike : undefined}>{task.title}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.meta}>
                {task.priority} • {task.dueDate === new Date().toISOString().split('T')[0] ? 'Today' : task.dueDate}
              </ThemedText>
            </View>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.initials}>SM</ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontFamily: 'Poppins_400Regular', paddingVertical: 12 },
  group: { fontSize: 11, letterSpacing: 1.2, paddingHorizontal: 16, marginBottom: 8 },
  chips: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  chip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  filters: { paddingHorizontal: 16, marginBottom: 12 },
  filterTitle: { fontSize: 11, letterSpacing: 1.2, marginBottom: 8, opacity: 0.7 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  filterValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 8 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  strike: { textDecorationLine: 'line-through', opacity: 0.55 },
  meta: { fontSize: 12, textTransform: 'capitalize' },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
});
