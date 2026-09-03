import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

const KEYS = {
  pin: 'ordina.appPinHash.v1',
  lockUntil: 'ordina.appLockUntil.v1',
  attempts: 'ordina.appPinAttempts.v1',
};

const MAX_ATTEMPTS = 3;
const LOCK_MS = 3 * 60 * 1000;

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

async function hashPin(pin: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `ordina:${pin}`);
}

type LockState = {
  hydrated: boolean;
  hasPin: boolean;
  unlocked: boolean;
  lockUntil: number;
  attempts: number;
  hydrate: () => Promise<void>;
  createPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<'ok' | 'wrong' | 'locked'>;
  remainingMs: () => number;
  markUnlocked: () => void;
  markLocked: () => void;
};

export const useLockStore = create<LockState>((set, get) => ({
  hydrated: false,
  hasPin: false,
  unlocked: false,
  lockUntil: 0,
  attempts: 0,

  hydrate: async () => {
    const pin = await read(KEYS.pin);
    const lockUntil = Number((await read(KEYS.lockUntil)) || 0);
    const attempts = Number((await read(KEYS.attempts)) || 0);
    set({
      hydrated: true,
      hasPin: Boolean(pin),
      lockUntil: Number.isFinite(lockUntil) ? lockUntil : 0,
      attempts: Number.isFinite(attempts) ? attempts : 0,
    });
  },

  remainingMs: () => Math.max(0, get().lockUntil - Date.now()),

  markUnlocked: () => set({ unlocked: true, attempts: 0 }),
  markLocked: () => set({ unlocked: false }),

  createPin: async (pin) => {
    await write(KEYS.pin, await hashPin(pin));
    await write(KEYS.attempts, '0');
    await write(KEYS.lockUntil, null);
    set({ hasPin: true, unlocked: true, attempts: 0, lockUntil: 0 });
  },

  verifyPin: async (pin) => {
    if (get().remainingMs() > 0) return 'locked';
    const stored = await read(KEYS.pin);
    if (!stored) return 'wrong';
    const ok = (await hashPin(pin)) === stored;
    if (ok) {
      await write(KEYS.attempts, '0');
      set({ unlocked: true, attempts: 0 });
      return 'ok';
    }
    const next = get().attempts + 1;
    if (next >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCK_MS;
      await write(KEYS.lockUntil, String(until));
      await write(KEYS.attempts, '0');
      set({ attempts: 0, lockUntil: until, unlocked: false });
      return 'locked';
    }
    await write(KEYS.attempts, String(next));
    set({ attempts: next });
    return 'wrong';
  },
}));

export { MAX_ATTEMPTS };
