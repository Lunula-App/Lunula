import { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, useTheme, Dialog, Portal, TextInput, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { readBackup, restoreBackup, BackupData } from '../../../src/services/backupService';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useLogStore } from '../../../src/stores/logStore';
import { useAuthStore } from '../../../src/stores/authStore';

type ImportStep = 'passphrase' | 'confirm' | null;

const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: 'calendar-month-outline',
    title: 'Cycle tracking and predictions',
    body: 'Track your period and see predictions for upcoming phases and your next period.',
  },
  {
    icon: 'clipboard-pulse-outline',
    title: 'Daily logging',
    body: 'Record symptoms, mood, energy, flow, and cravings to build a picture over time.',
  },
  {
    icon: 'yoga',
    title: 'Phase-appropriate exercises',
    body: 'Pelvic floor exercises tailored to where you are in your cycle.',
  },
  {
    icon: 'book-open-variant',
    title: 'Understand your cycle',
    body: 'Clear explanations of each phase and what to expect from your body.',
  },
  {
    icon: 'shield-lock-outline',
    title: 'Fully private by design',
    body: 'No account, no servers. All data stays on your device. Optional PIN or biometric lock.',
  },
];

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
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Surface style={[styles.heroCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
          <MaterialCommunityIcons
            name="flower-tulip-outline"
            size={44}
            color={theme.colors.primary}
            style={{ marginBottom: 14 }}
          />
          <Text variant="displaySmall" style={[styles.appName, { color: theme.colors.primary }]}>
            Bloom
          </Text>
          <Text variant="bodyMedium" style={[styles.tagline, { color: theme.colors.onPrimaryContainer }]}>
            Your private cycle companion.{'\n'}All data stays on your device.
          </Text>
        </Surface>

        {/* Features */}
        {FEATURES.map((f) => (
          <Surface
            key={f.title}
            style={[styles.featureCard, { backgroundColor: theme.colors.surface }]}
            elevation={1}
          >
            <MaterialCommunityIcons name={f.icon as any} size={24} color={theme.colors.primary} />
            <View style={styles.featureText}>
              <Text variant="titleSmall" style={{ color: theme.colors.onBackground, fontWeight: '700', marginBottom: 2 }}>
                {f.title}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                {f.body}
              </Text>
            </View>
          </Surface>
        ))}

        <Text variant="bodySmall" style={[styles.privacy, { color: theme.colors.onSurfaceVariant }]}>
          No account needed. No data ever leaves your device without your permission.
        </Text>
      </ScrollView>

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, gap: 12 },
  heroCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: { fontWeight: '700', letterSpacing: -0.5, marginBottom: 10 },
  tagline: { textAlign: 'center', lineHeight: 24 },
  featureCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureText: { flex: 1 },
  privacy: { textAlign: 'center', lineHeight: 18, paddingHorizontal: 8, paddingTop: 4 },
  footer: { padding: 24, paddingBottom: 32 },
  button: { borderRadius: 28 },
  buttonContent: { paddingVertical: 8 },
  dialogContent: { gap: 0 },
  importSummary: { borderRadius: 12, padding: 12, gap: 4 },
});
