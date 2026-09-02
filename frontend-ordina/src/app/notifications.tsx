import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useProductivityStore } from '@/store/productivity-store';

export default function NotificationsScreen() {
  const theme = useTheme();
  const { notifications, loadNotifications, markAllNotificationsRead } = useProductivityStore();

  useEffect(() => { void loadNotifications(); }, [loadNotifications]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Notifications</ThemedText>
        <View style={styles.headerRight}>
          <Pressable onPress={() => void markAllNotificationsRead()}><ThemedText style={{ color: theme.primary }}>Mark all read</ThemedText></Pressable>
          <Ionicons name="options-outline" size={20} color={theme.textSecondary} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {notifications.map((notification) => <View key={notification.id} style={[styles.card, { backgroundColor: theme.card, opacity: notification.read ? 0.65 : 1 }]}><View style={[styles.icon, { backgroundColor: theme.primary }]}><Ionicons name="notifications" size={16} color="#FFFFFF" /></View><View style={{ flex: 1 }}><ThemedText style={styles.cardTitle}>{notification.title}</ThemedText><ThemedText themeColor="textSecondary">{notification.message}</ThemedText></View></View>)}
        {notifications.length === 0 && <ThemedText themeColor="textSecondary">No notifications yet.</ThemedText>}
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
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold' },
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
