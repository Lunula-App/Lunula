import { getDatabase, generateId, nowIso } from '../client';
import {
  DailyLog, FlowIntensity, Symptom, Mood, Craving,
  SYMPTOM_LABELS, MOOD_LABELS, CRAVING_LABELS,
} from '../../models/log';

// Derive valid value sets from the label records so there's a single source of truth
const VALID_SYMPTOMS = new Set<string>(Object.keys(SYMPTOM_LABELS));
const VALID_MOODS = new Set<string>(Object.keys(MOOD_LABELS));
const VALID_CRAVINGS = new Set<string>(Object.keys(CRAVING_LABELS));

function safeParseArray<T extends string>(
  raw: string | null | undefined,
  validValues: Set<string>
): T[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is T =>
      typeof item === 'string' && validValues.has(item)
    );
  } catch {
    return [];
  }
}

function rowToLog(row: Record<string, unknown>): DailyLog {
  return {
    id: row.id as string,
    date: row.date as string,
    cycleRecordId: row.cycle_record_id as string | null,
    isPeriodDay: Boolean(row.is_period_day),
    flowIntensity: row.flow_intensity as FlowIntensity,
    symptoms: safeParseArray<Symptom>(row.symptoms as string, VALID_SYMPTOMS),
    moods: safeParseArray<Mood>(row.moods as string, VALID_MOODS),
    cravings: safeParseArray<Craving>(row.cravings as string, VALID_CRAVINGS),
    energyLevel: (row.energy_level as 1 | 2 | 3 | null) ?? null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getLogForDate(date: string): Promise<DailyLog | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM daily_logs WHERE date = ?',
    [date]
  );
  return row ? rowToLog(row) : null;
}

export async function getLogsInRange(
  startDate: string,
  endDate: string
): Promise<DailyLog[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM daily_logs WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [startDate, endDate]
  );
  return rows.map(rowToLog);
}

export async function upsertLog(
  log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<DailyLog> {
  const db = getDatabase();
  const now = nowIso();
  const existing = await getLogForDate(log.date);

  if (existing) {
    await db.runAsync(
      `UPDATE daily_logs SET
        cycle_record_id = ?, is_period_day = ?, flow_intensity = ?,
        symptoms = ?, moods = ?, cravings = ?,
        energy_level = ?, notes = ?, updated_at = ?
      WHERE date = ?`,
      [
        log.cycleRecordId ?? null,
        log.isPeriodDay ? 1 : 0,
        log.flowIntensity,
        JSON.stringify(log.symptoms),
        JSON.stringify(log.moods),
        JSON.stringify(log.cravings),
        log.energyLevel ?? null,
        log.notes ?? null,
        now,
        log.date,
      ]
    );
    return { ...existing, ...log, updatedAt: now };
  } else {
    const id = log.id ?? generateId();
    await db.runAsync(
      `INSERT INTO daily_logs (
        id, date, cycle_record_id, is_period_day, flow_intensity,
        symptoms, moods, cravings, energy_level, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        log.date,
        log.cycleRecordId ?? null,
        log.isPeriodDay ? 1 : 0,
        log.flowIntensity,
        JSON.stringify(log.symptoms),
        JSON.stringify(log.moods),
        JSON.stringify(log.cravings),
        log.energyLevel ?? null,
        log.notes ?? null,
        now,
        now,
      ]
    );
    return { id, ...log, createdAt: now, updatedAt: now };
  }
}

export async function getRecentLogs(limitRecords = 90): Promise<DailyLog[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM daily_logs ORDER BY date DESC LIMIT ?',
    [limitRecords]
  );
  return rows.map(rowToLog);
}

export async function getAllLogs(): Promise<DailyLog[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM daily_logs ORDER BY date ASC'
  );
  return rows.map(rowToLog);
}

export async function getEarliestLogDate(): Promise<string | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ date: string }>(
    'SELECT date FROM daily_logs ORDER BY date ASC LIMIT 1'
  );
  return row?.date ?? null;
}
