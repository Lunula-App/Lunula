import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

export default function LockScreen() {
  const theme = useTheme();
  const { unlockWithPin, unlockWithBiometric, biometricAvailable, pinLength } = useAuthStore();
  const { settings } = useSettingsStore();
  const PIN_LENGTH = pinLength;
  const biometricEnabled = biometricAvailable && (settings?.biometricEnabled ?? false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (biometricEnabled) {
      tryBiometric().catch((err) => console.error('Biometric init error:', err));
    }
  }, [biometricEnabled]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) return;
    lockTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setLockSecondsLeft(0);
        setError('');
        if (lockTimerRef.current) clearInterval(lockTimerRef.current);
      } else {
        setLockSecondsLeft(remaining);
      }
    }, 500);
    return () => {
      if (lockTimerRef.current) clearInterval(lockTimerRef.current);
    };
  }, [lockedUntil]);

  async function tryBiometric() {
    const success = await unlockWithBiometric();
    if (!success) {
      setError('Biometric failed. Enter your PIN.');
    }
  }

  async function handleDigit(digit: string) {
    if (pin.length >= PIN_LENGTH || checking) return;
    if (lockedUntil && Date.now() < lockedUntil) return;
    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === PIN_LENGTH) {
      await checkPin(next);
    }
  }

  async function checkPin(candidate: string) {
    if (lockedUntil && Date.now() < lockedUntil) {
      setPin('');
      setError(`Too many attempts. Wait ${lockSecondsLeft}s.`);
      return;
    }
    setChecking(true);
    const success = await unlockWithPin(candidate);
    if (!success) {
      const newFailed = failedAttempts + 1;
      setFailedAttempts(newFailed);
      setPin('');
      if (newFailed >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockedUntil(until);
        setLockSecondsLeft(Math.ceil(LOCKOUT_MS / 1000));
        setError(`Too many attempts. Locked for ${Math.ceil(LOCKOUT_MS / 1000)}s.`);
      } else {
        const remaining = MAX_ATTEMPTS - newFailed;
        setError(`Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
      }
    }
    setChecking(false);
  }

  function handleDelete() {
    if (lockedUntil && Date.now() < lockedUntil) return;
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  const isLockedOut = !!lockedUntil && Date.now() < lockedUntil;
  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.circle, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="flower-tulip-outline" size={38} color={theme.colors.primary} />
          </View>
          <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, fontWeight: '600' }}>
            Bloom
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Enter your PIN to continue
          </Text>
        </View>

        <View style={styles.dotsRow}>
          {dots.map((filled, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: filled
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                  borderColor: theme.colors.outline,
                },
              ]}
            />
          ))}
        </View>

        {!!error && (
          <Text
            variant="bodySmall"
            style={[styles.error, { color: theme.colors.error }]}
          >
            {error}
          </Text>
        )}

        <View style={styles.keypad}>
          {KEYPAD.map((row, ri) => (
            <View key={ri} style={styles.keyRow}>
              {row.map((key) =>
                key === 'bio' ? (
                  biometricEnabled ? (
                    <IconButton
                      key="bio"
                      icon="fingerprint"
                      size={32}
                      onPress={tryBiometric}
                      iconColor={theme.colors.primary}
                    />
                  ) : (
                    <View key="bio" style={styles.keyPlaceholder} />
                  )
                ) : key === 'del' ? (
                  <IconButton
                    key="del"
                    icon="backspace-outline"
                    size={28}
                    onPress={handleDelete}
                    iconColor={theme.colors.onSurface}
                  />
                ) : (
                  <Button
                    key={key}
                    mode="text"
                    onPress={() => handleDigit(key)}
                    disabled={checking || isLockedOut}
                    style={styles.keyButton}
                    labelStyle={styles.keyLabel}
                  >
                    {key}
                  </Button>
                )
              )}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['bio', '0', 'del'],
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 36 },
  hero: { alignItems: 'center', gap: 12 },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: { flexDirection: 'row', gap: 20 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  error: { textAlign: 'center' },
  keypad: { gap: 8 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  keyButton: { width: 80, height: 64 },
  keyLabel: { fontSize: 24, fontWeight: '400' },
  keyPlaceholder: { width: 80, height: 64 },
});
