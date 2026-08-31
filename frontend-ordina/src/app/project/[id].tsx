import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useProjectsStore } from '@/store/projects-store';
import { useTasksStore } from '@/store/tasks-store';
import { href } from '@/utils/href';

export default function ProjectDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === id));
  const { tasks, toggleComplete } = useTasksStore();
  const projectTasks = tasks.filter((t) => t.projectId === id);

  if (!project) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <ThemedText>Project not found.</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.navTitle}>Project Detail</ThemedText>
        <Ionicons name="ellipsis-horizontal" size={20} color={theme.text} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.hero, { backgroundColor: theme.card }]}>
          <View style={[styles.icon, { backgroundColor: project.color + '33' }]}>
            <Ionicons name="briefcase" size={22} color={project.color} />
          </View>
          <ThemedText style={styles.name}>{project.name}</ThemedText>
          <ThemedText themeColor="textSecondary">{project.subtitle}</ThemedText>
          <View style={styles.progressRow}>
            <View style={[styles.track, { backgroundColor: theme.border }]}>
              <View style={[styles.fill, { width: `${project.progress}%`, backgroundColor: theme.primary }]} />
            </View>
            <ThemedText style={{ color: theme.primary }}>{project.progress}%</ThemedText>
          </View>
        </View>
        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: theme.card }]}>
            <ThemedText style={styles.statNum}>{project.tasksTotal}</ThemedText>
            <ThemedText themeColor="textSecondary">Tasks</ThemedText>
          </View>
          <View style={[styles.stat, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.statNum, { color: theme.success }]}>{project.tasksCompleted}</ThemedText>
            <ThemedText themeColor="textSecondary">Completed</ThemedText>
          </View>
          <View style={[styles.stat, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.statNum, { color: theme.danger }]}>{project.tasksOverdue}</ThemedText>
            <ThemedText themeColor="textSecondary">Overdue</ThemedText>
          </View>
        </View>
        <ThemedText themeColor="textSecondary" style={styles.group}>
          ACTIVE TASKS
        </ThemedText>
        {projectTasks.map((task) => (
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
                {task.priority} • {task.dueDate}
              </ThemedText>
            </View>
          </View>
        ))}
        <Pressable
          onPress={() => router.push(href('/new-task'))}
          style={[styles.add, { borderColor: theme.primary }]}>
          <ThemedText style={{ color: theme.primary }}>+ Add Task</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  body: { padding: 16, paddingBottom: 32 },
  hero: { borderRadius: 16, padding: 16, gap: 6, marginBottom: 12 },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  stat: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  group: { fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },
  task: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  strike: { textDecorationLine: 'line-through', opacity: 0.5 },
  meta: { fontSize: 12, textTransform: 'capitalize' },
  add: { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
});
