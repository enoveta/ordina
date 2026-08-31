import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const extraApiUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? extraApiUrl ?? 'http://localhost:4000';

export const TOKEN_KEY = 'ordina.token';

async function readToken() {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string | null) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
      return;
    }
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await readToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function apiMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { error?: { message?: string } })?.error?.message ||
      error.message
    );
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export async function getHealth() {
  const response = await api.get('/api/health');
  return response.data;
}

export async function registerAccount(body: Record<string, unknown>) {
  const { data } = await api.post('/api/auth/register', body);
  return data.data;
}

export async function loginAccount(body: { email: string; password: string }) {
  const { data } = await api.post('/api/auth/login', body);
  return data.data;
}

export async function googleAuth(idToken: string) {
  const { data } = await api.post('/api/auth/google', { idToken });
  return data.data;
}

export async function appleAuth(body: { identityToken: string; fullName?: string }) {
  const { data } = await api.post('/api/auth/apple', body);
  return data.data;
}

export async function fetchTasks() {
  const { data } = await api.get('/api/tasks');
  return data.data.tasks;
}

export async function createTaskApi(body: Record<string, unknown>) {
  const { data } = await api.post('/api/tasks', body);
  return data.data.task;
}

export async function updateTaskApi(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch(`/api/tasks/${id}`, body);
  return data.data.task;
}

export async function deleteTaskApi(id: string) {
  await api.delete(`/api/tasks/${id}`);
}

export async function fetchProjects() {
  const { data } = await api.get('/api/projects');
  return data.data.projects;
}

export async function createProjectApi(body: Record<string, unknown>) {
  const { data } = await api.post('/api/projects', body);
  return data.data.project;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post('/api/auth/forgot-password', { email });
  return data.data;
}

export async function sendAiMessage(message: string) {
  const { data } = await api.post('/api/ai/chat', { message });
  return data.data;
}
