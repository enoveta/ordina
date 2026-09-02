import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { api, setAuthToken } from '@/services/api';

const KEYS = {
  onboarding: 'ordina.hasSeenOnboarding',
  session: 'ordina.session',
};

async function read(key: string) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string | null) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      return;
    }
    if (value == null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // local session only
  }
}

export type AuthUser = {
  id?: number;
  name: string;
  email: string;
  token?: string;
};

type AuthState = {
  hydrated: boolean;
  hasSeenOnboarding: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (payload: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  hasSeenOnboarding: false,
  isSignedIn: false,
  user: null,

  hydrate: async () => {
    const onboarding = await read(KEYS.onboarding);
    const session = await read(KEYS.session);
    let user: AuthUser | null = null;
    if (session) {
      try {
        user = JSON.parse(session) as AuthUser;
      } catch {
        user = null;
      }
    }
    set({
      hydrated: true,
      hasSeenOnboarding: onboarding === '1',
      isSignedIn: Boolean(user),
      user,
    });
    setAuthToken(user?.token);
  },

  completeOnboarding: async () => {
    await write(KEYS.onboarding, '1');
    set({ hasSeenOnboarding: true });
  },

  signIn: async ({ email, password }) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    const user: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      token: data.token,
    };
    await write(KEYS.session, JSON.stringify(user));
    await write(KEYS.onboarding, '1');
    setAuthToken(user.token);
    set({ isSignedIn: true, user, hasSeenOnboarding: true });
  },

  signUp: async ({ name, email, password }) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    const user: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      token: data.token,
    };
    await write(KEYS.session, JSON.stringify(user));
    await write(KEYS.onboarding, '1');
    setAuthToken(user.token);
    set({ isSignedIn: true, user, hasSeenOnboarding: true });
  },

  signOut: async () => {
    await write(KEYS.session, null);
    setAuthToken();
    set({ isSignedIn: false, user: null });
  },
}));
