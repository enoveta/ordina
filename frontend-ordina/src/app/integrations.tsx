import Ionicons from '@expo/vector-icons/Ionicons';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/services/api';
import { getNotificationPermission, ensureNotificationPermission } from '@/services/notifications';

type Row = { id: string; label: string; why: string; state: string; request: () => Promise<void> };

export default function IntegrationsScreen() {
  const theme = useTheme();
  const [states, setStates] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const contacts = await Contacts.getPermissionsAsync();
    const calendar = await Calendar.getCalendarPermissionsAsync();
    const location = await Location.getForegroundPermissionsAsync();
    const camera = await ImagePicker.getCameraPermissionsAsync();
    const notifications = await getNotificationPermission();
    setStates({
      contacts: contacts.status,
      calendar: calendar.status,
      location: location.status,
      camera: camera.status,
      notifications,
      microphone: 'Ask when you use voice',
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function savePlace(name: string) {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Location', 'Allow location so ORDINA can save this place.');
      return;
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    try {
      await api.post('/api/places', {
        name,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radiusMeters: 150,
      });
      Alert.alert('Place saved', `${name} is saved. Ask ORDINA: “Remind me when I arrive at ${name.toLowerCase()}”.`);
    } catch (error: any) {
      Alert.alert('Place', error?.response?.data?.message || 'Could not save that place. Sign in and try again.');
    }
  }

  const rows: Row[] = [
    {
      id: 'contacts',
      label: 'Contacts',
      why: 'Used only to match a name such as “Call John”, not to upload your whole address book.',
      state: states.contacts || 'undetermined',
      request: async () => {
        const result = await Contacts.requestPermissionsAsync();
        if (!result.granted) Alert.alert('Contacts', 'Permission denied. ORDINA will skip contact matching.');
        await refresh();
      },
    },
    {
      id: 'calendar',
      label: 'Calendar',
      why: 'Read busy times and create events after you confirm an ORDINA schedule.',
      state: states.calendar || 'undetermined',
      request: async () => {
        await Calendar.requestCalendarPermissionsAsync();
        await refresh();
      },
    },
    {
      id: 'microphone',
      label: 'Microphone',
      why: 'Required to speak to ORDINA. Audio is sent to the backend for transcription, not stored in the app.',
      state: states.microphone || 'undetermined',
      request: async () => {
        Alert.alert('Microphone', 'ORDINA will ask when you tap the mic on the AI screen.');
      },
    },
    {
      id: 'notifications',
      label: 'Notifications',
      why: 'Task reminders, deadlines and schedule alerts.',
      state: states.notifications || 'undetermined',
      request: async () => {
        await ensureNotificationPermission();
        await refresh();
      },
    },
    {
      id: 'location',
      label: 'Location',
      why: 'Only while the app is open: arrival reminders like “when I arrive at work”. Background geofences need a native build.',
      state: states.location || 'undetermined',
      request: async () => {
        await Location.requestForegroundPermissionsAsync();
        await refresh();
      },
    },
    {
      id: 'camera',
      label: 'Camera / files',
      why: 'Send a photo of a list or whiteboard so ORDINA can propose tasks. Confirm before anything is saved.',
      state: states.camera || 'undetermined',
      request: async () => {
        await ImagePicker.requestCameraPermissionsAsync();
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        await refresh();
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.title}>Integrations</ThemedText>
      </View>
      <ThemedText themeColor="textSecondary" style={styles.lead}>
        Every integration is optional. ORDINA never bypasses the system permission prompt.
      </ThemedText>
      <ScrollView contentContainerStyle={styles.list}>
        {rows.map((row) => (
          <Pressable
            key={row.id}
            onPress={() => void row.request()}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.label}>{row.label}</ThemedText>
              <ThemedText themeColor="textSecondary">{row.why}</ThemedText>
            </View>
            <ThemedText style={{ color: theme.primary, textTransform: 'capitalize' }}>{row.state}</ThemedText>
          </Pressable>
        ))}
        <Pressable
          onPress={() => void savePlace('Home')}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.label}>Save current location as Home</ThemedText>
            <ThemedText themeColor="textSecondary">Used for “remind me when I arrive at home”.</ThemedText>
          </View>
        </Pressable>
        <Pressable
          onPress={() => void savePlace('Work')}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.label}>Save current location as Work</ThemedText>
            <ThemedText themeColor="textSecondary">Used for “remind me when I arrive at work”.</ThemedText>
          </View>
        </Pressable>
        <Pressable onPress={() => void Linking.openSettings()}>
          <ThemedText style={{ color: theme.primary, textAlign: 'center' }}>Open system settings</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, marginBottom: 8 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  lead: { marginBottom: 16, lineHeight: 20 },
  list: { gap: 12, paddingBottom: 32 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  label: { fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
});
