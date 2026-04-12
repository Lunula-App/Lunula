import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, useTheme, Dialog, Portal, TextInput, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { readBackup, restoreBackup, BackupData } from '../../../src/services/backupService';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useLogStore } from '../../../src/stores/logStore';
import { useAuthStore } from '../../../src/stores/authStore';

type ImportStep = 'passphrase' | 'confirm' | null;

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [importStep, setImportStep] = useState<ImportStep>(null);
  const [importFilePath, setImportFilePath] = useState<string | null>(null);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importError, setImportError] = useState('');
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [importing, setImporting] = useState(false);

  async function handlePickBackupFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.name.endsWith('.bloom')) {
      Alert.alert('Invalid file', 'Please select a .bloom backup file created by Bloom.');
      return;
    }
    setImportFilePath(asset.uri);
    setImportPassphrase('');
    setImportError('');
    setImportData(null);
    setImportStep('passphrase');
  }

  async function handleDecryptBackup() {
    if (!importFilePath || !importPassphrase) {
      setImportError('Please enter your passphrase.');
      return;
    }
    setImporting(true);
    setImportError('');
    try {
      const data = await readBackup(importFilePath, importPassphrase);
      setImportData(data);
      setImportStep('confirm');
    } catch (e: any) {
      setImportError(e.message ?? 'Failed to decrypt backup.');
    } finally {
      setImporting(false);
    }
  }

  async function handleConfirmRestore() {
    if (!importData) return;
    setImporting(true);
    try {
      await useAuthStore.getState().removePin(); // clear any existing PIN before overwriting data
      await restoreBackup(importData);
      await useSettingsStore.getState().load();
      await useLogStore.getState().loadToday();
      await useAuthStore.getState().checkSetup();
      setImportStep(null);
      setImportData(null);
      router.replace('/(app)/today');
    } catch (e: any) {
      Alert.alert('Restore failed', e.message ?? 'Unknown error');
      setImporting(false);
    }
  }

  function dismissImport() {
    if (importing) return;
    setImportStep(null);
    setImportFilePath(null);
    setImportData(null);
    setImportPassphrase('');
    setImportError('');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.circle, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.emoji]}>🌸</Text>
          </View>
          <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
            Bloom
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Your private cycle companion.{'\n'}All data stays on your device.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        <Text
          variant="bodySmall"
          style={[styles.privacy, { color: theme.colors.onSurfaceVariant }]}
        >
          No account needed. No data ever leaves your device without your permission.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => router.push('/(auth)/onboarding/cycle-info')}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Get Started
        </Button>
        <Button
          mode="text"
          onPress={handlePickBackupFile}
          style={{ marginTop: 4 }}
        >
          Restore from backup
        </Button>
      </View>

      {/* Passphrase dialog */}
      <Portal>
        <Dialog
          visible={importStep === 'passphrase'}
          onDismiss={dismissImport}
          style={{ borderRadius: 20 }}
        >
          <Dialog.Title>Enter backup passphrase</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
              Enter the passphrase you used when this backup was created.
            </Text>
            <TextInput
              label="Passphrase"
              value={importPassphrase}
              onChangeText={(t) => { setImportPassphrase(t); setImportError(''); }}
              secureTextEntry
              mode="outlined"
              autoCapitalize="none"
              autoFocus
              disabled={importing}
            />
            {!!importError && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>
                {importError}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={dismissImport} disabled={importing}>Cancel</Button>
            <Button mode="contained" onPress={handleDecryptBackup} loading={importing} disabled={importing}>
              Decrypt
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Confirm restore dialog */}
      <Portal>
        <Dialog
          visible={importStep === 'confirm'}
          onDismiss={dismissImport}
          style={{ borderRadius: 20 }}
        >
          <Dialog.Icon icon="database-import" color={theme.colors.primary} />
          <Dialog.Title style={{ textAlign: 'center' }}>Restore backup?</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            {importData && (
              <>
                <Surface
                  style={[styles.importSummary, { backgroundColor: theme.colors.surfaceVariant }]}
                  elevation={0}
                >
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {importData.logs.length} log{importData.logs.length !== 1 ? 's' : ''}
                    {importData.logs.length > 0
                      ? `  ·  ${importData.logs[0].date} → ${importData.logs[importData.logs.length - 1].date}`
                      : ''}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {importData.cycleRecords.length} cycle record{importData.cycleRecords.length !== 1 ? 's' : ''}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Exported: {importData.exportedAt ? new Date(importData.exportedAt).toLocaleDateString() : 'unknown'}
                  </Text>
                </Surface>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}
                >
                  You can set a new PIN in Security settings after restoring.
                </Text>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={dismissImport} disabled={importing}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleConfirmRestore}
              loading={importing}
              disabled={importing}
            >
              Restore
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const FEATURES = [
  { icon: '📅', text: 'Track your cycle and predict future periods' },
  { icon: '💊', text: 'Log symptoms, mood, energy, and cravings' },
  { icon: '🧘', text: 'Phase-appropriate pelvic floor exercises' },
  { icon: '📚', text: 'Learn about each phase of your cycle' },
  { icon: '🔒', text: 'Fully private — protected by PIN or biometrics' },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 40, justifyContent: 'space-between' },
  hero: { alignItems: 'center', gap: 16 },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: { fontSize: 56 },
  title: { fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { textAlign: 'center', lineHeight: 24 },
  features: { gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  privacy: { textAlign: 'center', lineHeight: 18 },
  footer: { padding: 24, paddingBottom: 32 },
  button: { borderRadius: 28 },
  buttonContent: { paddingVertical: 8 },
  dialogContent: { gap: 0 },
  importSummary: { borderRadius: 12, padding: 12, gap: 4 },
});
