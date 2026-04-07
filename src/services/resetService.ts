import * as SecureStore from 'expo-secure-store';
import { getDatabase } from '../db/client';

const SECURE_STORE_KEYS = [
  'bloom_pin_hash',
  'bloom_pin_salt',
  'bloom_backup_salt_v2',
];

/**
 * Wipes all user data from the app:
 *  - Clears every table in the SQLite database
 *  - Deletes all SecureStore entries
 *
 * After calling this, the caller should navigate to onboarding and
 * reset all in-memory Zustand stores.
 */
export async function resetAllData(): Promise<void> {
  const db = getDatabase();

  await db.execAsync(`
    DELETE FROM daily_logs;
    DELETE FROM cycle_records;
    DELETE FROM exercise_sessions;
    DELETE FROM user_settings;
    DELETE FROM schema_migrations;
  `);

  await Promise.all(
    SECURE_STORE_KEYS.map((key) =>
      SecureStore.deleteItemAsync(key).catch(() => {})
    )
  );
}
