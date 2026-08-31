import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

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
  name: string;
  email: string;
};

type AuthState = {
  hydrated: boolean;
  hasSeenOnboarding: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  signIn: (user: AuthUser) => Promise<void>;
  signUp: (user: AuthUser) => Promise<void>;
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
  },

  completeOnboarding: async () => {
    await write(KEYS.onboarding, '1');
    set({ hasSeenOnboarding: true });
  },

  signIn: async (user) => {
    await write(KEYS.session, JSON.stringify(user));
    await write(KEYS.onboarding, '1');
    set({ isSignedIn: true, user, hasSeenOnboarding: true });
  },

  signUp: async (user) => {
    await write(KEYS.session, JSON.stringify(user));
    await write(KEYS.onboarding, '1');
    set({ isSignedIn: true, user, hasSeenOnboarding: true });
  },

  signOut: async () => {
    await write(KEYS.session, null);
    set({ isSignedIn: false, user: null });
  },
}));
