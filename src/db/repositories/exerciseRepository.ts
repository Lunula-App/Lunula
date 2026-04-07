import { getDatabase, generateId, nowIso } from '../client';
import { ExerciseSession } from '../../models/exercise';

function rowToSession(row: Record<string, unknown>): ExerciseSession {
  return {
    id: row.id as string,
    date: row.date as string,
    exerciseId: row.exercise_id as string,
    setsCompleted: row.sets_completed as number,
    repsCompleted: row.reps_completed as number,
    durationSeconds: row.duration_seconds as number,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
  };
}

export async function saveExerciseSession(
  session: Omit<ExerciseSession, 'id' | 'createdAt'>
): Promise<ExerciseSession> {
  const db = getDatabase();
  const id = generateId();
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO exercise_sessions (
      id, date, exercise_id, sets_completed, reps_completed,
      duration_seconds, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      session.date,
      session.exerciseId,
      session.setsCompleted,
      session.repsCompleted,
      session.durationSeconds,
      session.notes ?? null,
      now,
    ]
  );

  return { id, ...session, createdAt: now };
}

export async function getSessionsForDate(date: string): Promise<ExerciseSession[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM exercise_sessions WHERE date = ? ORDER BY created_at DESC',
    [date]
  );
  return rows.map(rowToSession);
}

export async function getRecentSessions(limitDays = 30): Promise<ExerciseSession[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM exercise_sessions ORDER BY date DESC LIMIT ?',
    [limitDays]
  );
  return rows.map(rowToSession);
}
