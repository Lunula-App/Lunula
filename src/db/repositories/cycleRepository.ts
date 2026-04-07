import { getDatabase, generateId, nowIso } from '../client';
import { CycleRecord } from '../../models/cycle';

function rowToCycle(row: Record<string, unknown>): CycleRecord {
  return {
    id: row.id as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string | null,
    cycleLength: row.cycle_length as number | null,
    periodDuration: row.period_duration as number | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getLatestCycle(): Promise<CycleRecord | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM cycle_records ORDER BY start_date DESC LIMIT 1'
  );
  return row ? rowToCycle(row) : null;
}

export async function getRecentCycles(limit = 12): Promise<CycleRecord[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM cycle_records ORDER BY start_date DESC LIMIT ?',
    [limit]
  );
  return rows.map(rowToCycle);
}

export async function createCycleRecord(
  startDate: string
): Promise<CycleRecord> {
  const db = getDatabase();
  const id = generateId();
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO cycle_records (id, start_date, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [id, startDate, now, now]
  );
  return { id, startDate, endDate: null, cycleLength: null, periodDuration: null, notes: null, createdAt: now, updatedAt: now };
}

export async function closeCycleRecord(
  id: string,
  endDate: string,
  periodDuration: number
): Promise<void> {
  const db = getDatabase();
  const now = nowIso();
  await db.runAsync(
    `UPDATE cycle_records SET end_date = ?, period_duration = ?, updated_at = ?
     WHERE id = ?`,
    [endDate, periodDuration, now, id]
  );
}

export async function updateCycleLength(
  id: string,
  cycleLength: number
): Promise<void> {
  const db = getDatabase();
  const now = nowIso();
  await db.runAsync(
    'UPDATE cycle_records SET cycle_length = ?, updated_at = ? WHERE id = ?',
    [cycleLength, now, id]
  );
}
