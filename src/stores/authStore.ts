import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';

const KEYS = {
  PIN_HASH: 'bloom_pin_hash',
  PIN_SALT: 'bloom_pin_salt',
};

const LOCK_AFTER_BG_MS = 60_000; // 1 minute

interface AuthState {
  isUnlocked: boolean;
  hasPinSetup: boolean;
  biometricAvailable: boolean;
  // Actions
  checkSetup: () => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  lock: () => void;
  startBackgroundTimer: () => () => void;
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + salt
  );
}

function generateSalt(): string {
  const bytes = Crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(bytes).toString('hex');
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isUnlocked: false,
  hasPinSetup: false,
  biometricAvailable: false,

  checkSetup: async () => {
    const pinHash = await SecureStore.getItemAsync(KEYS.PIN_HASH);
    const hasPinSetup = !!pinHash;

    const bioResult = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const biometricAvailable = bioResult && enrolled;

    set({ hasPinSetup, biometricAvailable });

    // If no PIN is set up, treat as unlocked (first launch before onboarding)
    if (!hasPinSetup) {
      set({ isUnlocked: true });
    }
  },

  unlockWithPin: async (pin: string): Promise<boolean> => {
    try {
      const storedHash = await SecureStore.getItemAsync(KEYS.PIN_HASH);
      const salt = await SecureStore.getItemAsync(KEYS.PIN_SALT);
      if (!storedHash || !salt) return false;

      const candidateHash = await hashPin(pin, salt);
      const success = candidateHash === storedHash;
      if (success) set({ isUnlocked: true });
      return success;
    } catch {
      return false;
    }
  },

  unlockWithBiometric: async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Bloom',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });
      if (result.success) set({ isUnlocked: true });
      return result.success;
    } catch {
      return false;
    }
  },

  setupPin: async (pin: string): Promise<void> => {
    const salt = generateSalt();
    const hash = await hashPin(pin, salt);
    await SecureStore.setItemAsync(KEYS.PIN_HASH, hash);
    await SecureStore.setItemAsync(KEYS.PIN_SALT, salt);
    set({ hasPinSetup: true, isUnlocked: true });
  },

  removePin: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(KEYS.PIN_HASH);
    await SecureStore.deleteItemAsync(KEYS.PIN_SALT);
    set({ hasPinSetup: false, isUnlocked: true });
  },

  lock: () => set({ isUnlocked: false }),

  startBackgroundTimer: () => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const { lock } = get();

    const start = () => {
      timer = setTimeout(() => lock(), LOCK_AFTER_BG_MS);
    };

    const cancel = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    start();
    return cancel;
  },
}));
