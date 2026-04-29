import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, TextInput, HelperText, Switch, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSettingsStore } from '../../../src/stores/settingsStore';

export default function SecurityScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { hasPinSetup, biometricAvailable, setupPin, removePin } = useAuthStore();
  const { settings, update: updateSettings } = useSettingsStore();

  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [enableBiometricOnSetup, setEnableBiometricOnSetup] = useState(false);

  async function handleSetPin() {
    if (pin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    if (pin !== pinConfirm) { setPinError('PINs do not match'); return; }
    setPinError('');
    setSaving(true);
    await setupPin(pin);
    if (!hasPinSetup && enableBiometricOnSetup) {
      await updateSettings({ biometricEnabled: true });
    }
    setSaving(false);
    setPin('');
    setPinConfirm('');
    setShowForm(false);
  }

  async function handleRemovePin() {
    setRemoving(true);
    await removePin();
    setRemoving(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left">
          Back
        </Button>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          Security
        </Text>
      </View>

      <View style={styles.content}>
        <List.Section>
          <List.Subheader>PIN Protection</List.Subheader>
          {hasPinSetup ? (
            <>
              <List.Item
                title="PIN is enabled"
                description="Your data is protected"
                left={(props) => <List.Icon {...props} icon="shield-check" color={theme.colors.primary} />}
              />
              {biometricAvailable && (
                <List.Item
                  title="Biometric unlock"
                  description="Use Face ID or fingerprint to unlock"
                  left={(props) => <List.Icon {...props} icon="fingerprint" />}
                  right={() => (
                    <Switch
                      value={settings?.biometricEnabled ?? false}
                      onValueChange={(v) => updateSettings({ biometricEnabled: v })}
                    />
                  )}
                />
              )}
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => setShowForm(!showForm)}
                  style={{ flex: 1 }}
                >
                  Change PIN
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleRemovePin}
                  loading={removing}
                  textColor={theme.colors.error}
                  style={{ flex: 1, borderColor: theme.colors.error }}
                >
                  Remove PIN
                </Button>
              </View>
            </>
          ) : (
            <List.Item
              title="No PIN set"
              description="Add a PIN to protect your data"
              left={(props) => <List.Icon {...props} icon="shield-off" />}
            />
          )}
        </List.Section>

        {(!hasPinSetup || showForm) && (
          <View style={styles.pinForm}>
            <TextInput
              label="New PIN (4–6 digits)"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              mode="outlined"
            />
            <TextInput
              label="Confirm PIN"
              value={pinConfirm}
              onChangeText={setPinConfirm}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              mode="outlined"
              error={!!pinError}
            />
            {!!pinError && <HelperText type="error">{pinError}</HelperText>}
            {!hasPinSetup && biometricAvailable && (
              <List.Item
                title="Also enable biometric unlock"
                description="Use Face ID or fingerprint instead of PIN"
                left={(props) => <List.Icon {...props} icon="fingerprint" />}
                right={() => (
                  <Switch
                    value={enableBiometricOnSetup}
                    onValueChange={setEnableBiometricOnSetup}
                  />
                )}
                style={styles.biometricRow}
                onPress={() => setEnableBiometricOnSetup((v) => !v)}
              />
            )}
            <Button
              mode="contained"
              onPress={handleSetPin}
              loading={saving}
              disabled={saving}
              style={{ borderRadius: 28 }}
            >
              {hasPinSetup ? 'Update PIN' : 'Set PIN'}
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  title: { fontWeight: '700', flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  pinForm: { gap: 12, paddingHorizontal: 4, marginTop: 8 },
  biometricRow: { paddingHorizontal: 0, marginHorizontal: -8 },
});
