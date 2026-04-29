import { getDatabase, nowIso } from '../client';
import { UserSettings } from '../../models/cycle';

function rowToSettings(row: Record<string, unknown>): UserSettings {
  return {
    id: 1,
    avgCycleLength: row.avg_cycle_length as number,
    avgPeriodDuration: row.avg_period_duration as number,
    lastPeriodEndDate: row.last_period_end_date as string,
    lastPeriodStartDate: row.last_period_start_date as string,
    pinHash: row.pin_hash as string | null,
    biometricEnabled: Boolean(row.biometric_enabled),
    syncProvider: row.sync_provider as UserSettings['syncProvider'],
    syncEnabled: Boolean(row.sync_enabled),
    lastSyncAt: row.last_sync_at as string | null,
    onboardingComplete: Boolean(row.onboarding_complete),
    darkMode: (row.dark_mode as UserSettings['darkMode']) ?? 'system',
    accentColor: (row.accent_color as string) ?? 'teal',
    isIrregular: Boolean(row.is_irregular),
    minCycleLength: (row.min_cycle_length as number | null) ?? null,
    maxCycleLength: (row.max_cycle_length as number | null) ?? null,
    notifyDailyLog: Boolean(row.notify_daily_log),
    notifyDailyLogTime: (row.notify_daily_log_time as string) ?? '20:00',
    notifyPeriodReminder: Boolean(row.notify_period_reminder),
    notifyPeriodDaysBefore: (row.notify_period_days_before as number) ?? 2,
    notifyKegel: Boolean(row.notify_kegel),
    notifyKegelTime: (row.notify_kegel_time as string) ?? '09:00',
    notifyBackup: Boolean(row.notify_backup),
    notifyBackupIntervalWeeks: ((row.notify_backup_interval_weeks as number) ?? 2) as 1 | 2 | 4,
    exerciseAudioCues: Boolean(row.exercise_audio_cues),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getSettings(): Promise<UserSettings | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM user_settings WHERE id = 1'
  );
  return row ? rowToSettings(row) : null;
}

export async function saveSettings(
  partial: Partial<Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = getDatabase();
  const existing = await getSettings();
  const now = nowIso();

  if (!existing) {
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
        notify_backup, notify_backup_interval_weeks,
        exercise_audio_cues,
        created_at, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        partial.avgCycleLength ?? 28,
        partial.avgPeriodDuration ?? 5,
        partial.lastPeriodEndDate ?? '',
        partial.lastPeriodStartDate ?? '',
        partial.pinHash ?? null,
        partial.biometricEnabled ? 1 : 0,
        partial.syncProvider ?? 'none',
        partial.syncEnabled ? 1 : 0,
        partial.lastSyncAt ?? null,
        partial.onboardingComplete ? 1 : 0,
        partial.darkMode ?? 'system',
        partial.accentColor ?? 'teal',
        partial.notifyDailyLog ? 1 : 0,
        partial.notifyDailyLogTime ?? '20:00',
        partial.notifyPeriodReminder ? 1 : 0,
        partial.notifyPeriodDaysBefore ?? 2,
        partial.notifyKegel ? 1 : 0,
        partial.notifyKegelTime ?? '09:00',
        partial.isIrregular ? 1 : 0,
        partial.minCycleLength ?? null,
        partial.maxCycleLength ?? null,
        partial.notifyBackup ? 1 : 0,
        partial.notifyBackupIntervalWeeks ?? 2,
        partial.exerciseAudioCues ? 1 : 0,
        now,
        now,
      ]
    );
  } else {
    const merged = { ...existing, ...partial };
    await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE user_settings SET
        avg_cycle_length = ?, avg_period_duration = ?,
        last_period_end_date = ?, last_period_start_date = ?,
        pin_hash = ?, biometric_enabled = ?,
        sync_provider = ?, sync_enabled = ?, last_sync_at = ?,
        onboarding_complete = ?, dark_mode = ?, accent_color = ?,
        notify_daily_log = ?, notify_daily_log_time = ?,
        notify_period_reminder = ?, notify_period_days_before = ?,
        notify_kegel = ?, notify_kegel_time = ?,
        is_irregular = ?, min_cycle_length = ?, max_cycle_length = ?,
        notify_backup = ?, notify_backup_interval_weeks = ?,
        exercise_audio_cues = ?,
        updated_at = ?
      WHERE id = 1`,
      [
        merged.avgCycleLength,
        merged.avgPeriodDuration,
        merged.lastPeriodEndDate,
        merged.lastPeriodStartDate,
        merged.pinHash ?? null,
        merged.biometricEnabled ? 1 : 0,
        merged.syncProvider,
        merged.syncEnabled ? 1 : 0,
        merged.lastSyncAt ?? null,
        merged.onboardingComplete ? 1 : 0,
        merged.darkMode,
        merged.accentColor ?? 'teal',
        merged.notifyDailyLog ? 1 : 0,
        merged.notifyDailyLogTime,
        merged.notifyPeriodReminder ? 1 : 0,
        merged.notifyPeriodDaysBefore,
        merged.notifyKegel ? 1 : 0,
        merged.notifyKegelTime,
        merged.isIrregular ? 1 : 0,
        merged.minCycleLength ?? null,
        merged.maxCycleLength ?? null,
        merged.notifyBackup ? 1 : 0,
        merged.notifyBackupIntervalWeeks,
        merged.exerciseAudioCues ? 1 : 0,
        now,
      ]
    );
    }); // end transaction
  }
}
