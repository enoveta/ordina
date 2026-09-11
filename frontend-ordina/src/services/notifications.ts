import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

let asked = false;
let handlerConfigured = false;

type NotificationsModule = typeof import('expo-notifications');

async function loadNotifications(): Promise<NotificationsModule | null> {
  // Notifications are deferred until the native development build is ready.
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') return null;
  try {
    const notifications = await import('expo-notifications');
    if (!handlerConfigured) {
      notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerConfigured = true;
    }
    return notifications;
  } catch {
    return null;
  }
}

export async function getNotificationPermission() {
  const Notifications = await loadNotifications();
  if (!Notifications) return 'unavailable';
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return 'granted';
  }
  return current.status;
}

export async function ensureNotificationPermission() {
  const Notifications = await loadNotifications();
  if (!Notifications) return 'unavailable';
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
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
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

export async function presentImmediateNotification(title: string, body: string) {
  const Notifications = await loadNotifications();
  if (Notifications) {
    const permission = await ensureNotificationPermission();
    if (permission === 'granted') {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('ordina-reminders', {
          name: 'ORDINA reminders',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      return Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    }
  }
  Alert.alert(title, body);
  return null;
}
