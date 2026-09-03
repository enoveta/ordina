import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/theme-toggle';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/providers/i18n-provider';
import { useAuthStore } from '@/store/auth-store';
import { useTasksStore, type Task } from '@/store/tasks-store';
import { api } from '@/services/api';

function formatGreeting(t: (path: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('home.morning');
  if (hour < 17) return t('home.afternoon');
  return t('home.evening');
}

function formatDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
}

function getCategoryColor(category: Task['category']): string {
  switch (category) {
    case 'work':
      return '#5C4DF2';
    case 'health':
      return '#22C55E';
    case 'learning':
      return '#3B82F6';
    case 'personal':
      return '#F59E0B';
    case 'design':
      return '#EC4899';
    case 'database':
      return '#06B6D4';
    default:
      return '#64748B';
  }
}

function firstName(name?: string | null) {
  if (!name) return 'there';
  return name.split(' ')[0];
}

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const { tasks, toggleComplete, loadTasks } = useTasksStore();
  const [nextUp, setNextUp] = useState<string | null>(null);

  useEffect(() => {
    void loadTasks();
    void api
      .get('/api/dashboard')
      .then(({ data }) => {
        if (data?.recommendation?.title) setNextUp(data.recommendation.title);
      })
      .catch(() => undefined);
  }, [loadTasks]);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const todayTasks = tasks
    .filter((t) => t.dueDate === today)
    .sort((a, b) => Number(a.completed) - Number(b.completed) || (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  const upcomingTasks = tasks.filter((t) => t.dueDate === tomorrow && !t.completed).slice(0, 2);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>
              {formatGreeting(t)}, {firstName(user?.name)}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.dateText}>
              {formatDate()}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <ThemeToggle />
            <Pressable onPress={() => router.push('/ai')} style={[styles.orb, { backgroundColor: theme.backgroundSelected }]}>
              <Image source={require('@/assets/images/ordina-logo.png')} style={styles.orbImage} contentFit="contain" />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/ai')}
          style={[styles.aiBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="sparkles" size={18} color={theme.primary} />
          <ThemedText themeColor="textSecondary" style={styles.aiBarText}>
            {t('home.tellOrdina')}
          </ThemedText>
          <Ionicons name="mic-outline" size={20} color={theme.textSecondary} />
        </Pressable>

        {nextUp ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
            <ThemedText themeColor="textSecondary">Do this now</ThemedText>
            <ThemedText style={styles.sectionTitle}>{nextUp}</ThemedText>
          </View>
        ) : null}

        <ThemedText style={styles.sectionTitle}>{t('home.todaySchedule')}</ThemedText>
        {todayTasks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
            <ThemedText themeColor="textSecondary">{t('home.noTasksToday')}</ThemedText>
          </View>
        ) : (
          todayTasks.map((task) => (
            <View key={task.id} style={[styles.row, { backgroundColor: theme.card }]}>
              {task.startTime ? (
                <ThemedText themeColor="textSecondary" style={styles.time}>
                  {task.startTime}
                </ThemedText>
              ) : (
                <View style={styles.time} />
              )}
              <View style={[styles.dot, { backgroundColor: getCategoryColor(task.category) }]} />
              <ThemedText style={[styles.rowTitle, task.completed && styles.strike]} numberOfLines={1}>
                {task.title}
              </ThemedText>
              <TouchableOpacity
                onPress={() => toggleComplete(task.id)}
                style={[
                  styles.checkbox,
                  {
                    borderColor: task.completed ? theme.primary : theme.border,
                    backgroundColor: task.completed ? theme.primary : 'transparent',
                  },
                ]}>
                {task.completed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
              </TouchableOpacity>
            </View>
          ))
        )}

        {upcomingTasks.length > 0 ? (
          <>
            <ThemedText style={styles.sectionTitle}>{t('home.upcomingTomorrow')}</ThemedText>
            {upcomingTasks.map((task) => (
              <View key={task.id} style={[styles.upcoming, { backgroundColor: theme.card }]}>
                <View style={[styles.dot, { backgroundColor: getCategoryColor(task.category) }]} />
                <ThemedText numberOfLines={1}>
                  {task.startTime ? `${task.startTime} — ` : ''}
                  {task.title}
                </ThemedText>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greeting: { fontSize: 24, fontFamily: 'Poppins_700Bold', lineHeight: 30 },
  dateText: { fontSize: 14, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orb: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  orbImage: { width: 48, height: 48 },
  aiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 22,
  },
  aiBarText: { flex: 1, fontSize: 15 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 10,
  },
  time: { width: 58, fontSize: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowTitle: { flex: 1, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  strike: { textDecorationLine: 'line-through', opacity: 0.55 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: { borderRadius: 14, padding: 20, marginBottom: 12 },
  upcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
});
