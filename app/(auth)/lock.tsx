import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';

const PIN_LENGTH = 6;

export default function LockScreen() {
  const theme = useTheme();
  const { unlockWithPin, unlockWithBiometric, biometricAvailable } = useAuthStore();
  const { settings } = useSettingsStore();
  const biometricEnabled = biometricAvailable && (settings?.biometricEnabled ?? false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (biometricEnabled) {
      tryBiometric();
    }
  }, []);

  async function tryBiometric() {
    const success = await unlockWithBiometric();
    if (!success) {
      setError('Biometric failed. Enter your PIN.');
    }
  }

  async function handleDigit(digit: string) {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === PIN_LENGTH || next.length >= 4) {
      await checkPin(next);
    }
  }

  async function checkPin(candidate: string) {
    setChecking(true);
    const success = await unlockWithPin(candidate);
    if (!success) {
      setPin('');
      setError('Incorrect PIN. Try again.');
    }
    setChecking(false);
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.circle, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={styles.emoji}>🌸</Text>
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
                    disabled={checking}
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
  emoji: { fontSize: 38 },
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
