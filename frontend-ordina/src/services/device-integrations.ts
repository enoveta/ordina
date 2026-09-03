import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';

export async function matchingContacts(message: string) {
  const permission = await Contacts.getPermissionsAsync();
  if (!permission.granted) return [];
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name],
    pageSize: 50,
  });
  const words = message.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  return data
    .filter((contact) => {
      const name = (contact.name || '').toLowerCase();
      return words.some((word) => name.includes(word));
    })
    .slice(0, 8)
    .map((contact) => ({ name: contact.name || 'Unknown' }));
}

export async function createCalendarEvents(
  events: { title: string; date?: string; startTime?: string; durationMinutes?: number }[],
) {
  const permission = await Calendar.getCalendarPermissionsAsync();
  if (!permission.granted || !events.length) return { created: 0, skipped: true as const };
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((item) => item.allowsModifications) || calendars[0];
  if (!writable) return { created: 0, skipped: true as const };
  let created = 0;
  for (const event of events) {
    if (!event.date) continue;
    const start = new Date(`${event.date}T${event.startTime || '09:00'}:00`);
    const end = new Date(start.getTime() + (event.durationMinutes || 60) * 60 * 1000);
    await Calendar.createEventAsync(writable.id, {
      title: event.title,
      startDate: start,
      endDate: end,
    });
    created += 1;
  }
  return { created, skipped: false as const };
}

export async function pickTaskImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
  if (result.canceled) return null;
  return result.assets[0];
}
