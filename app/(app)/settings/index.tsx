import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text, useTheme, Surface, List, Divider,
  ActivityIndicator, Dialog, Portal, Button, TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useLogStore } from '../../../src/stores/logStore';
import { getRecentCycles } from '../../../src/db/repositories/cycleRepository';
import { createBackup, readBackup, restoreBackup, BackupData } from '../../../src/services/backupService';
import { hasPassphrase } from '../../../src/services/encryptionService';
import { resetAllData } from '../../../src/services/resetService';
import { ACCENTS, AccentKey } from '../../../src/theme/accents';

type ImportStep = 'passphrase' | 'confirm' | null;

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettingsStore();
  const { hasPinSetup } = useAuthStore();
  const [completedCycles, setCompletedCycles] = useState(0);
  const [exporting, setExporting] = useState(false);

  // Import state
  const [importStep, setImportStep] = useState<ImportStep>(null);
  const [importFilePath, setImportFilePath] = useState<string | null>(null);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importError, setImportError] = useState('');
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [importing, setImporting] = useState(false);

  // Reset dialog state
  const [resetVisible, setResetVisible] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const resetReady = resetConfirmText === 'I Understand';

  async function handleReset() {
    if (!resetReady) return;
    setResetting(true);
    try {
      await resetAllData();
      await useSettingsStore.getState().load();
      await useLogStore.getState().loadToday();
      await useAuthStore.getState().checkSetup();
      router.replace('/(auth)/onboarding/welcome');
    } catch (e: any) {
      Alert.alert('Reset failed', e.message ?? 'Unknown error');
      setResetting(false);
    }
  }

  // Passphrase dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isNewPassphrase, setIsNewPassphrase] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [passphraseError, setPassphraseError] = useState('');

  useEffect(() => {
    getRecentCycles(12).then((cycles) => {
      setCompletedCycles(cycles.filter((c) => c.cycleLength !== null).length);
    });
  }, [settings]);

  const themeLabel = settings?.darkMode === 'dark' ? 'Dark' : settings?.darkMode === 'light' ? 'Light' : 'System';
  const isAdaptive = completedCycles >= 3;

  async function openExportDialog() {
    const hasPp = await hasPassphrase();
    setIsNewPassphrase(!hasPp);
    setPassphrase('');
    setConfirmPassphrase('');
    setPassphraseError('');
    setDialogVisible(true);
  }

  async function handleExport() {
    if (isNewPassphrase) {
      if (passphrase.length < 8) {
        setPassphraseError('Passphrase must be at least 8 characters.');
        return;
      }
      const hasLetter = /[a-zA-Z]/.test(passphrase);
      const hasDigit = /[0-9]/.test(passphrase);
      const hasSymbol = /[^a-zA-Z0-9]/.test(passphrase);
      if ([hasLetter, hasDigit, hasSymbol].filter(Boolean).length < 2) {
        setPassphraseError('Passphrase must include at least letters and numbers (or symbols).');
        return;
      }
      if (passphrase !== confirmPassphrase) {
        setPassphraseError('Passphrases do not match.');
        return;
      }
    } else {
      if (!passphrase) {
        setPassphraseError('Please enter your passphrase.');
        return;
      }
    }

    setDialogVisible(false);
    setExporting(true);
    try {
      const path = await createBackup(passphrase);
      // Verify the backup can be decrypted before reporting success
      try {
        await readBackup(path, passphrase);
      } catch {
        throw new Error('Backup verification failed — the file may be corrupt. Please try again.');
      }
      try {
        const Sharing = await import('expo-sharing');
        await Sharing.shareAsync(path, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Save your Bloom backup',
          UTI: 'public.data',
        });
      } catch {
        // Sharing not supported on this device — show file location instead
        const filename = path.split('/').pop();
        Alert.alert(
          'Backup created',
          `Encrypted backup saved to your device.\n\nFile: ${filename}\n\nYour passphrase is required to restore this backup.`,
          [{ text: 'OK' }]
        );
      }
    } catch (e: any) {
      Alert.alert('Export failed', e.message ?? 'Unknown error');
    } finally {
      setExporting(false);
    }
  }

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
      await useAuthStore.getState().removePin(); // clear existing PIN before overwriting data
      await restoreBackup(importData);
      await useSettingsStore.getState().load();
      await useLogStore.getState().loadToday();
      await useAuthStore.getState().checkSetup();
      setImportStep(null);
      setImportData(null);
      Alert.alert(
        'Restore complete',
        'Your data has been restored. You can set a new PIN in Security settings.',
        [{ text: 'OK' }]
      );
    } catch (e: any) {
      Alert.alert('Restore failed', e.message ?? 'Unknown error');
    } finally {
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Settings
        </Text>

        {/* General */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Subheader>General</List.Subheader>
          <Divider />
          <List.Item
            title="Cycle Profile"
            description={
              settings
                ? `${settings.avgCycleLength}-day cycle, ${settings.avgPeriodDuration}-day period${isAdaptive ? ` · Learned from ${completedCycles} cycles` : ''}`
                : ''
            }
            left={(props) => <List.Icon {...props} icon="calendar-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/(app)/settings/profile')}
          />
          <Divider />
          <List.Item
            title="Notifications"
            description="Logging reminders and period alerts"
            left={(props) => <List.Icon {...props} icon="bell-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/(app)/settings/notifications')}
          />
          <Divider />
          <List.Item
            title="Appearance"
            description={`${themeLabel} · ${ACCENTS[(settings?.accentColor ?? 'teal') as AccentKey]?.label ?? 'Teal'}`}
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/(app)/settings/appearance')}
          />
        </Surface>

        {/* Data & Backup */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Subheader>Data &amp; Backup</List.Subheader>
          <Divider />
          <List.Item
            title="Security"
            description={hasPinSetup ? 'PIN enabled' : 'No PIN set'}
            left={(props) => <List.Icon {...props} icon="shield-lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/(app)/settings/security')}
          />
          <Divider />
          <List.Item
            title="Export Encrypted Backup"
            description="Encrypted with your passphrase"
            left={(props) => <List.Icon {...props} icon="database-export" />}
            right={() =>
              exporting
                ? <ActivityIndicator style={{ marginRight: 8 }} />
                : <List.Icon icon="chevron-right" />
            }
            onPress={openExportDialog}
            disabled={exporting}
          />
          <Divider />
          <List.Item
            title="Restore from Backup"
            description="Restore data from a .bloom file"
            left={(props) => <List.Icon {...props} icon="database-import" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handlePickBackupFile}
          />
        </Surface>

        {/* About */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Subheader>About</List.Subheader>
          <Divider />
          <List.Item
            title="App Version"
            description="Bloom 1.0.0 (MVP)"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="Privacy"
            description="How Bloom protects your data"
            left={(props) => <List.Icon {...props} icon="shield-check-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/(app)/settings/privacy')}
          />
        </Surface>

        {/* Reset */}
        <Button
          mode="outlined"
          icon="delete-forever"
          onPress={() => { setResetConfirmText(''); setResetVisible(true); }}
          style={[styles.resetButton, { borderColor: theme.colors.error }]}
          labelStyle={{ color: theme.colors.error }}
        >
          Reset App
        </Button>
      </ScrollView>

      {/* Reset confirmation dialog */}
      <Portal>
        <Dialog
          visible={resetVisible}
          onDismiss={() => !resetting && setResetVisible(false)}
          style={{ borderRadius: 20 }}
        >
          <Dialog.Icon icon="delete-forever" color={theme.colors.error} />
          <Dialog.Title style={{ textAlign: 'center', color: theme.colors.error }}>
            Reset App
          </Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
              This will permanently delete all your data including:
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22, marginBottom: 16 }}>
              • All cycle logs and history{'\n'}
              • Cycle records and predictions{'\n'}
              • Settings and preferences{'\n'}
              • PIN and security data{'\n'}
              • Backup encryption key
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600', marginBottom: 12 }}>
              This cannot be undone. If you have an encrypted backup, you will need your passphrase to restore it.
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              Type <Text style={{ fontWeight: '700', color: theme.colors.onSurface }}>I Understand</Text> to confirm.
            </Text>
            <TextInput
              value={resetConfirmText}
              onChangeText={setResetConfirmText}
              mode="outlined"
              autoCapitalize="words"
              placeholder="I Understand"
              disabled={resetting}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetVisible(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              onPress={handleReset}
              disabled={!resetReady || resetting}
              loading={resetting}
            >
              Reset
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Passphrase dialog */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={{ borderRadius: 20 }}
        >
          <Dialog.Title>
            {isNewPassphrase ? 'Set backup passphrase' : 'Enter passphrase'}
          </Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
              {isNewPassphrase
                ? 'Choose a passphrase to encrypt your backup. You will need it to restore your data.'
                : 'Enter the passphrase you used when you created this backup.'}
            </Text>
            <TextInput
              label="Passphrase"
              value={passphrase}
              onChangeText={(t) => { setPassphrase(t); setPassphraseError(''); }}
              secureTextEntry
              mode="outlined"
              autoCapitalize="none"
            />
            {isNewPassphrase && (
              <TextInput
                label="Confirm passphrase"
                value={confirmPassphrase}
                onChangeText={(t) => { setConfirmPassphrase(t); setPassphraseError(''); }}
                secureTextEntry
                mode="outlined"
                autoCapitalize="none"
                style={{ marginTop: 12 }}
              />
            )}
            {!!passphraseError && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>
                {passphraseError}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleExport}>
              Export
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      {/* Import — passphrase dialog */}
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

      {/* Import — confirmation dialog */}
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
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: '600', marginTop: 16, marginBottom: 4 }}
                >
                  This will replace all your current data.
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Your PIN will be cleared — you can set a new one in Security settings after restoring.
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },
  title: { fontWeight: '700', paddingHorizontal: 4 },
  card: { borderRadius: 16, overflow: 'hidden' },
  resetButton: { borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  dialogContent: { gap: 0 },
  importSummary: { borderRadius: 12, padding: 12, gap: 4 },
});
