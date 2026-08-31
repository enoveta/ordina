import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export default function NotificationsScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />
        <ThemedText style={styles.title}>Notifications</ThemedText>
        <View style={styles.headerRight}>
          <ThemedText style={{ color: theme.primary }}>Mark all read</ThemedText>
          <Ionicons name="options-outline" size={20} color={theme.textSecondary} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <ThemedText themeColor="textSecondary" style={styles.group}>
          TODAY
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={[styles.icon, { backgroundColor: theme.primary }]}>
            <Ionicons name="notifications" size={16} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.cardTop}>
              <ThemedText style={styles.cardTitle}>Task Alert: Call John</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.ago}>
                15m ago
              </ThemedText>
            </View>
            <ThemedText themeColor="textSecondary">
              Scheduled for 4:00 PM. John is expecting your callback.
            </ThemedText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 1 }]}>
          <View style={[styles.icon, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.cardTop}>
              <ThemedText style={styles.cardTitle}>AI Scheduling Slot</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.ago}>
                2h ago
              </ThemedText>
            </View>
            <ThemedText themeColor="textSecondary">
              ORDINA noticed you have a free slot at 2 PM. Schedule study time?
            </ThemedText>
            <View style={styles.actions}>
              <Pressable style={[styles.schedule, { backgroundColor: theme.primary }]} onPress={() => router.push('/ai')}>
                <ThemedText style={{ color: theme.onPrimary, fontFamily: 'Poppins_600SemiBold' }}>Schedule</ThemedText>
              </Pressable>
              <Pressable style={styles.dismiss}>
                <ThemedText themeColor="textSecondary">Dismiss</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        <ThemedText themeColor="textSecondary" style={styles.group}>
          YESTERDAY
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={[styles.icon, { backgroundColor: theme.danger }]}>
            <Ionicons name="warning" size={16} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.cardTop}>
              <ThemedText style={styles.cardTitle}>Project Deadline Approaching</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.ago}>
                1d ago
              </ThemedText>
            </View>
            <ThemedText themeColor="textSecondary">
              React Dashboard Rebuild milestone due in 3 days. 2 overdue tasks remaining.
            </ThemedText>
          </View>
        </View>
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
    gap: 10,
  },
  title: { flex: 1, fontSize: 22, fontFamily: 'Poppins_700Bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  group: { fontSize: 11, letterSpacing: 1.2, marginBottom: 10, marginTop: 8 },
  card: { flexDirection: 'row', gap: 12, borderRadius: 16, padding: 14, marginBottom: 10 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', flex: 1 },
  ago: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' },
  schedule: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  dismiss: { paddingVertical: 8 },
});
