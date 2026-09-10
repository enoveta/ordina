import { api } from '@/services/api';

export type IntegrationId = 'contacts' | 'calendar' | 'microphone' | 'notifications' | 'location' | 'camera';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export async function interpretInstruction(payload: {
  message: string;
  timezone?: string;
  contacts?: { name: string }[];
}) {
  const { data } = await api.post('/api/ai/interpret', payload);
  return data;
}

export async function confirmAiActions(payload: { tasks?: unknown[]; reschedule?: unknown; arrivalReminders?: unknown[] }) {
  const { data } = await api.post('/api/ai/confirm', payload);
  return data;
}

export async function interpretFromImage(payload: {
  image: string;
  mimeType?: string;
  timezone?: string;
}) {
  const { data } = await api.post('/api/ai/from-image', payload, { timeout: 90000 });
  return data;
}

export async function transcribeAudio(audio: string, mimeType?: string) {
  const { data } = await api.post('/api/ai/transcribe', { audio, mimeType }, { timeout: 90000 });
  return data.text as string;
}

export async function fetchAiMessages() {
  const { data } = await api.get('/api/ai/messages');
  return data.messages ?? [];
}

export async function requestPasswordReset(email: string) {
  const { data } = await api.post('/api/auth/forgot', { email });
  return data as { emailed: boolean; code?: string; message: string };
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const { data } = await api.post('/api/auth/reset', { email, code, newPassword });
  return data;
}
