import { Platform } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import {
  appleAuth,
  googleAuth,
  loginAccount,
  registerAccount,
  saveToken,
  TOKEN_KEY,
} from '@/services/api';

const KEYS = {
  welcome: 'ordina.hasSeenWelcome',
  questions: 'ordina.hasCompletedQuestions',
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
    // ignore
  }
}

export type AuthUser = {
  id?: number;
  name: string;
  email: string;
  age?: number | null;
  gender?: string | null;
  goals?: string[];
};

export type ProfileDraft = {
  name: string;
  age: string;
  gender: string;
  goals: string[];
};

type AuthState = {
  hydrated: boolean;
  hasSeenWelcome: boolean;
  hasCompletedQuestions: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  draft: ProfileDraft;
  hydrate: () => Promise<void>;
  completeWelcome: () => Promise<void>;
  completeQuestions: (draft: ProfileDraft) => Promise<void>;
  skipQuestions: () => Promise<void>;
  setDraft: (draft: Partial<ProfileDraft>) => void;
  applySession: (payload: { token: string; user: AuthUser }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInGoogle: (idToken: string) => Promise<void>;
  signInApple: (identityToken: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const emptyDraft: ProfileDraft = { name: '', age: '', gender: '', goals: [] };

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  hasSeenWelcome: false,
  hasCompletedQuestions: false,
  isSignedIn: false,
  user: null,
  draft: emptyDraft,

  hydrate: async () => {
    const welcome = await read(KEYS.welcome);
    const questions = await read(KEYS.questions);
    const session = await read(KEYS.session);
    const token = await read(TOKEN_KEY);
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
      hasSeenWelcome: welcome === '1',
      hasCompletedQuestions: questions === '1',
      isSignedIn: Boolean(token && user),
      user: token ? user : null,
    });
  },

  completeWelcome: async () => {
    await write(KEYS.welcome, '1');
    set({ hasSeenWelcome: true });
  },

  completeQuestions: async (draft) => {
    await write(KEYS.questions, '1');
    set({ hasCompletedQuestions: true, draft });
  },

  skipQuestions: async () => {
    await write(KEYS.questions, '1');
    set({ hasCompletedQuestions: true });
  },

  setDraft: (partial) => set({ draft: { ...get().draft, ...partial } }),

  applySession: async ({ token, user }) => {
    await saveToken(token);
    await write(KEYS.session, JSON.stringify(user));
    await write(KEYS.welcome, '1');
    await write(KEYS.questions, '1');
    set({
      isSignedIn: true,
      user,
      hasSeenWelcome: true,
      hasCompletedQuestions: true,
    });
  },

  signIn: async (email, password) => {
    const payload = await loginAccount({ email, password });
    await get().applySession(payload);
  },

  signUp: async (email, password) => {
    const { draft } = get();
    const payload = await registerAccount({
      email,
      password,
      name: draft.name || email.split('@')[0],
      age: draft.age ? Number(draft.age) : undefined,
      gender: draft.gender || undefined,
      goals: draft.goals,
    });
    await get().applySession(payload);
  },

  signInGoogle: async (idToken) => {
    const payload = await googleAuth(idToken);
    await get().applySession(payload);
  },

  signInApple: async (identityToken, fullName) => {
    const payload = await appleAuth({ identityToken, fullName });
    await get().applySession(payload);
  },

  signOut: async () => {
    await saveToken(null);
    await write(KEYS.session, null);
    set({ isSignedIn: false, user: null });
  },
}));
