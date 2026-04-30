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

/** Returns true if the given exercise has ever been completed. */
export async function hasEverCompletedExercise(exerciseId: string): Promise<boolean> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) as n FROM exercise_sessions WHERE exercise_id = ?',
    [exerciseId]
  );
  return (row?.n ?? 0) > 0;
}

/** Returns the set of distinct dates (YYYY-MM-DD) that have at least one session. */
export async function getSessionDateSet(): Promise<Set<string>> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT DISTINCT date FROM exercise_sessions'
  );
  return new Set(rows.map((r) => r.date));
}

/** Calculates current consecutive-day streak ending today. */
export function calculateStreak(sessionDates: Set<string>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (sessionDates.has(`${y}-${m}-${day}`)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Returns the last N date strings (YYYY-MM-DD) ending today, oldest first. */
export function lastNDates(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}
