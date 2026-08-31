import axios from 'axios';
import Constants from 'expo-constants';

const extraApiUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? extraApiUrl ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getHealth() {
  const response = await api.get('/api/health');
  return response.data;
}
