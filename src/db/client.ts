import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialised. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  if (db) return;

  db = await SQLite.openDatabaseAsync('bloom.db', {
    useNewConnection: false,
  });

  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Run all CREATE TABLE statements
  const statements = CREATE_TABLES.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await db.execAsync(statement + ';');
  }

  // Migrations — safe to run on every cold start (idempotent via try/catch)
  const migrations: string[] = [
    `ALTER TABLE user_settings ADD COLUMN biometric_enabled INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE user_settings ADD COLUMN notify_daily_log INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE user_settings ADD COLUMN notify_daily_log_time TEXT NOT NULL DEFAULT '20:00'`,
    `ALTER TABLE user_settings ADD COLUMN notify_period_reminder INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE user_settings ADD COLUMN notify_period_days_before INTEGER NOT NULL DEFAULT 2`,
    `ALTER TABLE user_settings ADD COLUMN notify_kegel INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE user_settings ADD COLUMN notify_kegel_time TEXT NOT NULL DEFAULT '09:00'`,
    `ALTER TABLE user_settings ADD COLUMN accent_color TEXT NOT NULL DEFAULT 'teal'`,
    `ALTER TABLE user_settings ADD COLUMN is_irregular INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE user_settings ADD COLUMN min_cycle_length INTEGER`,
    `ALTER TABLE user_settings ADD COLUMN max_cycle_length INTEGER`,
  ];

  for (const migration of migrations) {
    try {
      await db.execAsync(migration + ';');
    } catch {
      // Column already exists — safe to ignore
    }
  }
}

export function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 9)
  );
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
