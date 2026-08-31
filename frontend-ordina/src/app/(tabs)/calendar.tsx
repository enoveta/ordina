/**
 * ORDINA Calendar Screen
 * Matches the dark-mode mockup: August 2026 week view with day headers,
 * Week/Month toggle, and timed schedule blocks.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useTasksStore } from '@/store/tasks-store';

type ViewMode = 'week' | 'month';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM – 6 PM

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatHour(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    work: '#5C4DF2',
    health: '#22C55E',
    learning: '#7C3AED',
    personal: '#F59E0B',
    design: '#EC4899',
    database: '#06B6D4',
  };
  return map[category] ?? '#64748B';
}

function getWeekDays(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function CalendarScreen() {
  const theme = useTheme();
  const { tasks } = useTasksStore();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());

  const weekDays = getWeekDays(weekBase);
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const selectedISO = selectedDate.toISOString().split('T')[0];

  const dayTasks = tasks.filter(
    (t) => t.dueDate === selectedISO && t.startTime && !t.completed
  );

  function prevWeek() {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
  }

  function nextWeek() {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
  }

  const monthLabel = weekBase.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header: month + view toggle */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={prevWeek} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={styles.monthLabel}>{monthLabel}</ThemedText>
          <TouchableOpacity onPress={nextWeek} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Week / Month toggle */}
        <View style={[styles.toggle, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {(['week', 'month'] as ViewMode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setViewMode(m)}
              style={[
                styles.toggleBtn,
                { backgroundColor: viewMode === m ? theme.primary : 'transparent' },
              ]}
            >
              <ThemedText
                style={[styles.toggleText, { color: viewMode === m ? '#FFFFFF' : theme.textSecondary }]}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Day headers */}
      <View style={[styles.dayHeaderRow, { borderBottomColor: theme.border }]}>
        {weekDays.map((d, i) => {
          const iso = d.toISOString().split('T')[0];
          const isSelected = iso === selectedISO;
          const isToday = iso === new Date().toISOString().split('T')[0];
          return (
            <Pressable
              key={i}
              onPress={() => setSelectedDate(d)}
              style={styles.dayHeaderCell}
            >
              <ThemedText style={[styles.dayLetter, { color: isSelected ? theme.primary : theme.textSecondary }]}>
                {DAY_LABELS[i]}
              </ThemedText>
              <View
                style={[
                  styles.dayNumber,
                  {
                    backgroundColor: isSelected ? theme.primary : 'transparent',
                    borderWidth: isToday && !isSelected ? 1 : 0,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.dayNumberText,
                    { color: isSelected ? '#FFFFFF' : isToday ? theme.primary : theme.text },
                  ]}
                >
                  {d.getDate()}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Time grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {HOURS.map((hour) => {
          const hourStr = `${padZero(hour)}:00`;
          const hourTasks = dayTasks.filter((t) => {
            const [h] = (t.startTime ?? '').split(':').map(Number);
            return h === hour;
          });

          return (
            <View key={hour} style={[styles.timeRow, { borderTopColor: theme.border }]}>
              <ThemedText themeColor="textSecondary" style={styles.timeLabel}>
                {formatHour(hour)}
              </ThemedText>
              <View style={styles.timeSlot}>
                {hourTasks.map((t) => {
                  const color = getCategoryColor(t.category);
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => router.push(`/tasks/${t.id}` as any)}
                      style={[
                        styles.scheduleBlock,
                        { backgroundColor: color + 'DD', borderLeftColor: color },
                      ]}
                    >
                      <ThemedText style={styles.blockTitle} numberOfLines={1}>
                        {t.title}
                      </ThemedText>
                      <ThemedText style={styles.blockSub}>
                        {t.duration ?? ''} • {t.category}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthLabel: { fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  toggle: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  toggleText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  dayHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  dayHeaderCell: { flex: 1, alignItems: 'center', gap: 4 },
  dayLetter: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  timeRow: {
    flexDirection: 'row',
    minHeight: 60,
    borderTopWidth: 1,
    paddingVertical: 4,
  },
  timeLabel: {
    width: 72,
    paddingLeft: 12,
    paddingTop: 4,
    fontSize: 11,
  },
  timeSlot: { flex: 1, paddingRight: 16, gap: 4 },
  scheduleBlock: {
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 8,
    gap: 2,
  },
  blockTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  blockSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
});
