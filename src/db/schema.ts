export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    avg_cycle_length INTEGER NOT NULL DEFAULT 28,
    avg_period_duration INTEGER NOT NULL DEFAULT 5,
    last_period_end_date TEXT NOT NULL DEFAULT '',
    last_period_start_date TEXT NOT NULL DEFAULT '',
    pin_hash TEXT,
    biometric_enabled INTEGER NOT NULL DEFAULT 0,
    sync_provider TEXT NOT NULL DEFAULT 'none',
    sync_enabled INTEGER NOT NULL DEFAULT 0,
    last_sync_at TEXT,
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    dark_mode TEXT NOT NULL DEFAULT 'system',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cycle_records (
    id TEXT PRIMARY KEY,
    start_date TEXT NOT NULL,
    end_date TEXT,
    cycle_length INTEGER,
    period_duration INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    cycle_record_id TEXT REFERENCES cycle_records(id),
    is_period_day INTEGER NOT NULL DEFAULT 0,
    flow_intensity TEXT NOT NULL DEFAULT 'none',
    symptoms TEXT NOT NULL DEFAULT '[]',
    moods TEXT NOT NULL DEFAULT '[]',
    energy_level INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exercise_sessions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    sets_completed INTEGER NOT NULL DEFAULT 0,
    reps_completed INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
  CREATE INDEX IF NOT EXISTS idx_cycle_records_start ON cycle_records(start_date);
  CREATE INDEX IF NOT EXISTS idx_exercise_sessions_date ON exercise_sessions(date);
`;
