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

export async function confirmAiActions(payload: { tasks?: unknown[]; reschedule?: unknown }) {
  const { data } = await api.post('/api/ai/confirm', payload);
  return data;
}

export async function transcribeAudio(audio: string, mimeType?: string) {
  const { data } = await api.post('/api/ai/transcribe', { audio, mimeType });
  return data.text as string;
}

export async function fetchAiMessages() {
  const { data } = await api.get('/api/ai/messages');
  return data.messages ?? [];
}
