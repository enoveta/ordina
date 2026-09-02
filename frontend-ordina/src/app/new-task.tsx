import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useProjectsStore } from '@/store/projects-store';
import { useTasksStore, type Category, type Priority } from '@/store/tasks-store';

const CATEGORIES: Category[] = ['work', 'personal', 'health', 'learning', 'design', 'database'];

export default function NewTaskScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const addTask = useTasksStore((s) => s.addTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const tasks = useTasksStore((s) => s.tasks);
  const projects = useProjectsStore((s) => s.projects);

  const taskToEdit = useMemo(
    () => tasks.find((task) => task.id === params.id),
    [tasks, params.id]
  );

  const [title, setTitle] = useState(taskToEdit?.title ?? 'Design settings architecture');
  const [description, setDescription] = useState(
    taskToEdit?.description ??
      'Create the settings pane layout wireframes, mapping preferences, notifications toggle arrays, and account management lists.'
  );
  const [priority, setPriority] = useState<Priority>(taskToEdit?.priority ?? 'medium');
  const [category, setCategory] = useState<Category>(taskToEdit?.category ?? 'work');
  const [reminder, setReminder] = useState(taskToEdit?.reminder ?? true);
  const [projectId, setProjectId] = useState(taskToEdit?.projectId ?? projects[0]?.id);
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate ?? '2026-08-28');
  const [startTime, setStartTime] = useState(taskToEdit?.startTime ?? '10:00');
  const [duration, setDuration] = useState(taskToEdit?.duration ?? '1h 30m');

  useEffect(() => {
    if (!taskToEdit) return;
    setTitle(taskToEdit.title);
    setDescription(taskToEdit.description ?? '');
    setPriority(taskToEdit.priority);
    setCategory(taskToEdit.category);
    setReminder(taskToEdit.reminder ?? false);
    setProjectId(taskToEdit.projectId ?? projects[0]?.id);
    setDueDate(taskToEdit.dueDate ?? '2026-08-28');
    setStartTime(taskToEdit.startTime ?? '10:00');
    setDuration(taskToEdit.duration ?? '1h 30m');
  }, [taskToEdit, projects]);

  const isEditMode = Boolean(taskToEdit);

  function saveTask() {
    const basePayload = {
      title,
      description,
      status: taskToEdit?.status ?? 'todo',
      priority,
      category,
      projectId,
      dueDate,
      startTime,
      duration,
      reminder,
      completed: taskToEdit?.completed ?? false,
    };

    if (taskToEdit) {
      updateTask(taskToEdit.id, basePayload);
    } else {
      addTask(basePayload);
    }

    router.back();
  }

  function handleDelete() {
    if (!taskToEdit) return;
    deleteTask(taskToEdit.id);
    router.back();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{isEditMode ? 'Edit Task' : 'New Task'}</ThemedText>
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
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText themeColor="textSecondary" style={styles.label}>
              TIME
            </ThemedText>
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
              placeholder="HH:MM"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText themeColor="textSecondary" style={styles.label}>
              DURATION
            </ThemedText>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText themeColor="textSecondary" style={styles.label}>
              PROJECT
            </ThemedText>
            <Pressable
              onPress={() => {
                const nextProject = projects.find((p) => p.id !== projectId) ?? projects[0];
                setProjectId(nextProject?.id);
              }}
              style={[styles.input, styles.inline, { backgroundColor: theme.input }]}>
              <ThemedText numberOfLines={1}>{projects.find((p) => p.id === projectId)?.name ?? 'No project'}</ThemedText>
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

        <PrimaryButton label={isEditMode ? 'Save Changes' : 'Create Task'} onPress={saveTask} />

        {isEditMode && (
          <Pressable onPress={handleDelete} style={[styles.deleteButton, { borderColor: theme.danger }]}>
            <ThemedText style={{ color: theme.danger }}>Delete Task</ThemedText>
          </Pressable>
        )}
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
  deleteButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
