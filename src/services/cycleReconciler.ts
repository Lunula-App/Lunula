import { differenceInDays, parseISO, subDays, format } from 'date-fns';
import { DailyLog } from '../models/log';
import {
  getRecentCycles,
  createCycleRecord,
  closeCycleRecord,
  updateCycleLength,
} from '../db/repositories/cycleRepository';
import { saveSettings } from '../db/repositories/settingsRepository';
import { computeAdaptiveCycleLength, detectIrregularity } from './cycleEngine';

/**
 * Called after every log save. Derives cycle records purely from logged
 * period days so the source of truth is always what the user has logged —
 * not manual data entry.
 *
 * Steps:
 *  1. Detect period-start dates (period day with no period day the day before)
 *  2. Ensure a cycle record exists for each period start
 *  3. For each cycle that has a subsequent period start, compute and store
 *     cycle length and period duration
 *  4. If 3+ completed cycles exist, run the adaptive average and update settings
 *  5. Always keep lastPeriodStartDate / lastPeriodEndDate in settings current
 */
export async function reconcileCycles(logs: DailyLog[]): Promise<void> {
  if (logs.length === 0) return;

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const logByDate = new Map(sorted.map((l) => [l.date, l]));

  // ── 1. Find all period-start dates ──────────────────────────────────
  const periodStarts: string[] = [];
  for (const log of sorted) {
    if (!log.isPeriodDay) continue;
    const prevDate = format(subDays(parseISO(log.date), 1), 'yyyy-MM-dd');
    const prevLog = logByDate.get(prevDate);
    if (!prevLog || !prevLog.isPeriodDay) {
      periodStarts.push(log.date);
    }
  }

  if (periodStarts.length === 0) return;

  // ── 2. Ensure a cycle record exists for each period start ────────────
  const existingCycles = await getRecentCycles(24);
  const existingStarts = new Set(existingCycles.map((c) => c.startDate));

  for (const startDate of periodStarts) {
    if (!existingStarts.has(startDate)) {
      await createCycleRecord(startDate);
    }
  }

  // ── 3. Compute cycle lengths for closed cycles ───────────────────────
  const cycles = await getRecentCycles(24);

  for (let i = 0; i < cycles.length; i++) {
    const cycle = cycles[i];
    if (cycle.cycleLength !== null) continue; // already computed

    // Find the next period start after this cycle's start
    const nextStart = periodStarts.find((d) => d > cycle.startDate);
    if (!nextStart) continue; // this cycle is still open

    const cycleLength = differenceInDays(
      parseISO(nextStart),
      parseISO(cycle.startDate)
    );

    // Period duration = number of logged period days belonging to this cycle
    const periodDays = sorted.filter(
      (l) => l.isPeriodDay && l.date >= cycle.startDate && l.date < nextStart
    );
    const periodDuration = periodDays.length;
    const periodEndDate =
      periodDays.length > 0
        ? periodDays[periodDays.length - 1].date
        : cycle.startDate;

    await closeCycleRecord(cycle.id, periodEndDate, periodDuration);
    await updateCycleLength(cycle.id, cycleLength);
  }

  // ── 4. Adaptive average once we have 3+ completed cycles ─────────────
  const refreshed = await getRecentCycles(12);
  const completed = refreshed.filter(
    (c) => c.cycleLength !== null && c.cycleLength > 14 && c.cycleLength < 60
  );

  const settingsUpdate: Record<string, unknown> = {};

  if (completed.length >= 3) {
    const lengths = completed.map((c) => c.cycleLength!);

    const adaptiveLength = computeAdaptiveCycleLength(completed);
    const adaptivePeriodDuration = Math.round(
      completed
        .filter((c) => c.periodDuration !== null && c.periodDuration! > 0)
        .reduce((sum, c) => sum + c.periodDuration!, 0) /
        completed.filter((c) => c.periodDuration !== null && c.periodDuration! > 0).length
    );
    settingsUpdate.avgCycleLength = adaptiveLength;
    if (!isNaN(adaptivePeriodDuration) && adaptivePeriodDuration > 0) {
      settingsUpdate.avgPeriodDuration = adaptivePeriodDuration;
    }

    // Irregularity detection — use 6 most recent completed cycles
    // completed is already DESC order (newest first) from getRecentCycles
    const recentLengths = lengths.slice(0, 6);
    settingsUpdate.isIrregular = detectIrregularity(recentLengths);
    settingsUpdate.minCycleLength = Math.min(...recentLengths);
    settingsUpdate.maxCycleLength = Math.max(...recentLengths);
  }

  // ── 5. Keep lastPeriodStartDate / lastPeriodEndDate current ──────────
  const latestStart = periodStarts[periodStarts.length - 1];
  const latestPeriodDays = sorted.filter(
    (l) => l.isPeriodDay && l.date >= latestStart
  );
  const latestEnd =
    latestPeriodDays.length > 0
      ? latestPeriodDays[latestPeriodDays.length - 1].date
      : latestStart;

  settingsUpdate.lastPeriodStartDate = latestStart;
  settingsUpdate.lastPeriodEndDate = latestEnd;

  await saveSettings(settingsUpdate as Parameters<typeof saveSettings>[0]);
}
