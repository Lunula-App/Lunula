/**
 * Backup / restore service for Lunula.
 *
 * Backup file format (version 2):
 * {
 *   lunulaBackup: 2,
 *   createdAt: ISO string,
 *   salt: base64,           // PBKDF2 salt — safe to store publicly
 *   payload: EncryptedPayload
 * }
 *
 * The salt is stored alongside the ciphertext so the backup can be
 * restored on any device using only the passphrase — no key export needed.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from '@craftzdog/react-native-buffer';
import { getDatabase, nowIso } from '../db/client';
import { getSettings } from '../db/repositories/settingsRepository';
import { getAllLogs } from '../db/repositories/logRepository';
import { getRecentCycles } from '../db/repositories/cycleRepository';
import {
  getOrCreateSalt,
  hasPassphrase,
  importSalt,
  deriveKey,
  encrypt,
  decrypt,
  EncryptedPayload,
} from './encryptionService';
import { UserSettings } from '../models/cycle';
import { DailyLog } from '../models/log';
import { CycleRecord } from '../models/cycle';

const BACKUP_FILE_VERSION = 2;
const SCHEMA_VERSION = 1;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BackupData {
  schemaVersion: number;
  exportedAt: string;
  settings: UserSettings | null;
  logs: DailyLog[];
  cycleRecords: CycleRecord[];
}

export interface BackupFile {
  lunulaBackup: number;
  createdAt: string;
  salt: string;           // base64 PBKDF2 salt
  payload: EncryptedPayload;
}

// ── Export ────────────────────────────────────────────────────────────────────

/**
 * Serialises all app data, encrypts it with the given passphrase, and writes
 * to the app's document directory. Returns the full file path.
 */
export async function createBackup(passphrase: string): Promise<string> {
  const [settings, logs, cycleRecords] = await Promise.all([
    getSettings(),
    getAllLogs(),
    getRecentCycles(9999), // include all cycle records, not just the most recent 100
  ]);

  const data: BackupData = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    logs,
    cycleRecords,
  };

  const salt = await getOrCreateSalt();
  const key = deriveKey(passphrase, salt);
  const payload = encrypt(JSON.stringify(data), key);

  const file: BackupFile = {
    lunulaBackup: BACKUP_FILE_VERSION,
    createdAt: new Date().toISOString(),
    salt: salt.toString('base64'),
    payload,
  };

  const filename = `lunula_backup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.lunula`;
  const path = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(file), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return path;
}

// ── Import ────────────────────────────────────────────────────────────────────

/**
 * Reads an encrypted backup file, decrypts it with the given passphrase,
 * and returns the structured data. Also imports the backup's salt so future
 * backups on this device are compatible with the same passphrase.
 *
 * Throws if the file is invalid or if the passphrase is wrong.
 */
export async function readBackup(
  filePath: string,
  passphrase: string
): Promise<BackupData> {
  const content = await FileSystem.readAsStringAsync(filePath, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let file: BackupFile;
  try {
    file = JSON.parse(content);
  } catch {
    throw new Error('File is not a valid Lunula backup.');
  }

  if (file.lunulaBackup !== BACKUP_FILE_VERSION) {
    throw new Error(`Unsupported backup version: ${file.lunulaBackup}`);
  }

  if (!file.salt) {
    throw new Error('Backup file is missing salt — it may be from an older version.');
  }

  const salt = Buffer.from(file.salt, 'base64');
  const key = deriveKey(passphrase, salt);

  let plaintext: string;
  try {
    plaintext = decrypt(file.payload, key);
  } catch {
    throw new Error('Incorrect passphrase — please try again.');
  }

  // Validate decrypted structure before using it
  let data: BackupData;
  try {
    data = JSON.parse(plaintext) as BackupData;
  } catch {
    throw new Error('Backup data is corrupted and could not be read.');
  }

  if (typeof data !== 'object' || data === null || !data.schemaVersion || !Array.isArray(data.logs)) {
    throw new Error('Backup data has an unexpected format and cannot be restored.');
  }

  // Only import the salt if no passphrase is set on this device yet, to avoid
  // silently invalidating any existing backups the user made on this device.
  const alreadyHasPassphrase = await hasPassphrase();
  if (!alreadyHasPassphrase) {
    await importSalt(file.salt);
  }

  return data;
}

/**
 * Restores all app data from a decrypted BackupData object.
 * Clears the existing database contents first.
 *
 * PIN hash is intentionally NOT restored — the user must set a new PIN on
 * this device, since the hash is device-specific and unverifiable on a new one.
 */
export async function restoreBackup(data: BackupData): Promise<void> {
  const db = getDatabase();
  const now = nowIso();

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM daily_logs;
      DELETE FROM cycle_records;
      DELETE FROM user_settings;
    `);

    if (data.settings) {
      const s = data.settings;
      await db.runAsync(
        `INSERT INTO user_settings (
          id, avg_cycle_length, avg_period_duration,
          last_period_end_date, last_period_start_date,
          pin_hash, biometric_enabled,
          sync_provider, sync_enabled, last_sync_at,
          onboarding_complete, dark_mode, accent_color,
          notify_daily_log, notify_daily_log_time,
          notify_period_reminder, notify_period_days_before,
          notify_kegel, notify_kegel_time,
          is_irregular, min_cycle_length, max_cycle_length,
          created_at, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.avgCycleLength ?? 28,
          s.avgPeriodDuration ?? 5,
          s.lastPeriodEndDate ?? '',
          s.lastPeriodStartDate ?? '',
          null, // PIN hash intentionally not restored
          s.biometricEnabled ? 1 : 0,
          s.syncProvider ?? 'none',
          s.syncEnabled ? 1 : 0,
          s.lastSyncAt ?? null,
          s.onboardingComplete ? 1 : 0,
          s.darkMode ?? 'system',
          s.accentColor ?? 'teal',
          s.notifyDailyLog ? 1 : 0,
          s.notifyDailyLogTime ?? '20:00',
          s.notifyPeriodReminder ? 1 : 0,
          s.notifyPeriodDaysBefore ?? 2,
          s.notifyKegel ? 1 : 0,
          s.notifyKegelTime ?? '09:00',
          s.isIrregular ? 1 : 0,
          s.minCycleLength ?? null,
          s.maxCycleLength ?? null,
          now,
          now,
        ]
      );
    }

    for (const log of data.logs) {
      await db.runAsync(
        `INSERT INTO daily_logs (
          id, date, cycle_record_id, is_period_day, flow_intensity,
          discharge, symptoms, moods, energy_level, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.date,
          log.cycleRecordId ?? null,
          log.isPeriodDay ? 1 : 0,
          log.flowIntensity,
          (log as any).discharge ?? 'none',
          JSON.stringify(log.symptoms ?? []),
          JSON.stringify(log.moods ?? []),
          log.energyLevel ?? null,
          log.notes ?? null,
          log.createdAt ?? now,
          log.updatedAt ?? now,
        ]
      );
    }

    for (const cycle of data.cycleRecords) {
      await db.runAsync(
        `INSERT INTO cycle_records (
          id, start_date, end_date, cycle_length, period_duration, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cycle.id,
          cycle.startDate,
          cycle.endDate ?? null,
          cycle.cycleLength ?? null,
          cycle.periodDuration ?? null,
          cycle.notes ?? null,
          cycle.createdAt ?? now,
          cycle.updatedAt ?? now,
        ]
      );
    }
  });
}

/**
 * Lists all .lunula backup files saved in the document directory.
 */
export async function listLocalBackups(): Promise<FileSystem.FileInfo[]> {
  const dir = FileSystem.documentDirectory!;
  const files = await FileSystem.readDirectoryAsync(dir);
  const backupFiles = files.filter((f) => f.endsWith('.lunula'));

  const infos = await Promise.all(
    backupFiles.map((f) => FileSystem.getInfoAsync(dir + f))
  );
  return infos.filter((i) => i.exists).sort((a, b) =>
    (b.modificationTime ?? 0) - (a.modificationTime ?? 0)
  );
}
