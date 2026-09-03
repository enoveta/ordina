import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let asked = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return 'granted';
  }
  return current.status;
}

export async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return 'granted';
  }
  if (current.status === 'denied') return 'denied';
  if (asked) return current.status;
  asked = true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted ? 'granted' : next.status;
}

export async function scheduleLocalReminder(title: string, body: string, when: Date, data?: Record<string, string>) {
  const permission = await ensureNotificationPermission();
  if (permission !== 'granted') return null;
  if (when.getTime() <= Date.now()) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('ordina-reminders', {
      name: 'ORDINA reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
}
