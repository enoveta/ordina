import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiMessage } from '@/services/api';
import { useProjectsStore } from '@/store/projects-store';
import { useTasksStore, type Category, type Priority } from '@/store/tasks-store';

const CATEGORIES: Category[] = ['work', 'personal', 'health', 'learning'];

export default function NewTaskScreen() {
  const theme = useTheme();
  const addTask = useTasksStore((s) => s.addTask);
  const { projects, load: loadProjects } = useProjectsStore();
  const today = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('work');
  const [reminder, setReminder] = useState(true);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function create() {
    if (!title.trim()) {
      Alert.alert('New Task', 'Add a title for this task.');
      return;
    }
    setSaving(true);
    try {
      await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'todo',
        priority,
        category,
        projectId: projectId && /^\d+$/.test(projectId) ? projectId : undefined,
        dueDate: today,
        startTime: '10:00',
        duration: '1h 30m',
        reminder,
        completed: false,
      });
      router.back();
    } catch (error) {
      Alert.alert('New Task', apiMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>New Task</ThemedText>
        <Pressable onPress={() => router.back()} style={[styles.close, { backgroundColor: theme.card }]}>
          <Ionicons name="close" size={18} color={theme.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.form}>
        <ThemedText themeColor="textSecondary" style={styles.label}>
          TASK TITLE
        </ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
        />
        <ThemedText themeColor="textSecondary" style={styles.label}>
          DESCRIPTION
        </ThemedText>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          style={[styles.area, { backgroundColor: theme.input, color: theme.text }]}
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText themeColor="textSecondary" style={styles.label}>
              DATE
            </ThemedText>
            <View style={[styles.input, styles.inline, { backgroundColor: theme.input }]}>
              <ThemedText>{today}</ThemedText>
              <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText themeColor="textSecondary" style={styles.label}>
              TIME
            </ThemedText>
            <View style={[styles.input, styles.inline, { backgroundColor: theme.input }]}>
              <ThemedText>10:00 AM</ThemedText>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText themeColor="textSecondary" style={styles.label}>
              DURATION
            </ThemedText>
            <View style={[styles.input, { backgroundColor: theme.input }]}>
              <ThemedText>1h 30m</ThemedText>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText themeColor="textSecondary" style={styles.label}>
              PROJECT
            </ThemedText>
            <Pressable
              onPress={() => {
                if (!projects.length) return;
                const current = projects.findIndex((p) => p.id === projectId);
                setProjectId(projects[(current + 1) % projects.length]?.id);
              }}
              style={[styles.input, styles.inline, { backgroundColor: theme.input }]}>
              <ThemedText numberOfLines={1}>
                {projects.find((p) => p.id === projectId)?.name ?? 'None'}
              </ThemedText>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>
        <ThemedText themeColor="textSecondary" style={styles.label}>
          PRIORITY
        </ThemedText>
        <View style={styles.row}>
          {(['low', 'medium', 'high'] as Priority[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setPriority(item)}
              style={[
                styles.prio,
                {
                  borderColor: priority === item ? theme.primary : theme.border,
                  backgroundColor: theme.card,
                },
              ]}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item === 'high' ? '#EF4444' : item === 'medium' ? '#F59E0B' : '#3B82F6' },
                ]}
              />
              <ThemedText style={{ textTransform: 'capitalize' }}>{item}</ThemedText>
            </Pressable>
          ))}
        </View>
        <ThemedText themeColor="textSecondary" style={styles.label}>
          CATEGORY
        </ThemedText>
        <View style={styles.chips}>
          {CATEGORIES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[
                styles.chip,
                {
                  borderColor: category === item ? theme.primary : theme.border,
                  backgroundColor: theme.card,
                },
              ]}>
              <ThemedText style={{ textTransform: 'capitalize' }}>{item}</ThemedText>
            </Pressable>
          ))}
        </View>
        <View style={[styles.reminder, { backgroundColor: theme.card }]}>
          <Ionicons name="notifications-outline" size={18} color={theme.primary} />
          <ThemedText style={{ flex: 1 }}>Reminder (15m before)</ThemedText>
          <Switch value={reminder} onValueChange={setReminder} trackColor={{ true: theme.primary }} />
        </View>
        <PrimaryButton label={saving ? 'Saving…' : 'Create Task'} disabled={saving} onPress={() => void create()} />
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
    paddingVertical: 12,
  },
  title: { fontSize: 24, fontFamily: 'Poppins_700Bold' },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  form: { paddingHorizontal: 20, paddingBottom: 32, gap: 8 },
  label: { fontSize: 11, letterSpacing: 1.1, marginTop: 8 },
  input: { borderRadius: Radii.md, paddingHorizontal: 14, paddingVertical: 14, fontFamily: 'Poppins_400Regular' },
  area: { borderRadius: Radii.md, padding: 14, minHeight: 88, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  inline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prio: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12, paddingVertical: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14, marginVertical: 8 },
});
