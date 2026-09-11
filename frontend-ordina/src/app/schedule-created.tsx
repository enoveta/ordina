import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { href } from '@/utils/href';

const TIMELINE = [
  { time: '9:00 AM', duration: '2h', title: 'Finish React project', category: 'Work', color: '#8B5CF6' },
  { time: '11:00 AM', duration: '2h', title: 'Study PostgreSQL', category: 'Education', color: '#3B82F6' },
  { time: '4:00 PM', duration: '30m', title: 'Call John', category: 'Personal', color: '#F59E0B' },
  { time: '6:30 PM', duration: '1h', title: 'Go to the gym', category: 'Health', color: '#22C55E' },
];

export default function ScheduleCreatedScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.hero}>
        <View style={[styles.check, { backgroundColor: theme.success }]}>
          <Ionicons name="checkmark" size={36} color="#FFFFFF" />
        </View>
        <ThemedText style={styles.title}>Schedule Created</ThemedText>
        <ThemedText themeColor="textSecondary">August 28 is fully optimized</ThemedText>
      </View>
      <ThemedText themeColor="textSecondary" style={styles.group}>
        TIMELINE
      </ThemedText>
      {TIMELINE.map((item) => (
        <View key={item.title} style={styles.row}>
          <View style={styles.when}>
            <ThemedText style={styles.time}>{item.time}</ThemedText>
            <ThemedText themeColor="textSecondary">{item.duration}</ThemedText>
          </View>
          <View style={[styles.card, { backgroundColor: theme.card, borderLeftColor: item.color }]}>
            <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
            <ThemedText style={{ color: item.color }}>{item.category}</ThemedText>
          </View>
        </View>
      ))}
      <View style={styles.footer}>
        <PrimaryButton label="Add to Calendar" onPress={() => router.replace(href('/calendar'))} />
        <Pressable onPress={() => router.replace('/ai')} style={styles.changes}>
          <ThemedText>Make Changes</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  hero: { alignItems: 'center', paddingTop: 24, gap: 8, marginBottom: 24 },
  check: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold' },
  group: { fontSize: 11, letterSpacing: 1.4, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  when: { width: 72 },
  time: { fontFamily: 'Poppins_600SemiBold' },
  card: { flex: 1, borderLeftWidth: 4, borderRadius: 12, padding: 12 },
  cardTitle: { fontFamily: 'Poppins_500Medium' },
  footer: { marginTop: 'auto', paddingBottom: 24, gap: 12 },
  changes: { alignItems: 'center', paddingVertical: 8 },
});
