import { addDays, differenceInDays, parseISO, format, isAfter, isSameDay } from 'date-fns';
import { UserSettings, CyclePrediction, CyclePhase, CycleRecord } from '../models/cycle';

// A cycle is considered irregular if the standard deviation of completed
// cycle lengths exceeds this threshold (days).
const IRREGULARITY_STDDEV_THRESHOLD = 7;

function getOvulationDay(cycleLength: number): number {
  // Luteal phase is relatively constant at ~14 days
  return cycleLength - 14;
}

function getPhaseForDay(
  cycleDay: number,
  periodDuration: number,
  ovulationDay: number,
  cycleLength: number
): CyclePhase {
  if (cycleDay <= periodDuration) return 'menstrual';
  if (cycleDay < ovulationDay - 1) return 'follicular';
  if (cycleDay <= ovulationDay + 1) return 'ovulatory';
  return 'luteal';
}

function getPhaseStartDay(
  phase: CyclePhase,
  periodDuration: number,
  ovulationDay: number
): number {
  switch (phase) {
    case 'menstrual': return 1;
    case 'follicular': return periodDuration + 1;
    case 'ovulatory': return ovulationDay - 1;
    case 'luteal': return ovulationDay + 2;
  }
}

function getPhaseDuration(
  phase: CyclePhase,
  periodDuration: number,
  ovulationDay: number,
  cycleLength: number
): number {
  switch (phase) {
    case 'menstrual': return periodDuration;
    case 'follicular': return ovulationDay - 2 - periodDuration;
    case 'ovulatory': return 3;
    case 'luteal': return cycleLength - (ovulationDay + 1);
  }
}

export function estimateCycleStart(settings: UserSettings): Date {
  const today = new Date();

  // Prefer the actual logged period start date — it's always accurate.
  // Fall back to reconstructing from lastPeriodEndDate for legacy data.
  let anchorStart: Date | null = null;
  if (settings.lastPeriodStartDate) {
    const d = parseISO(settings.lastPeriodStartDate);
    if (!isNaN(d.getTime())) anchorStart = d;
  }
  if (!anchorStart) {
    if (!settings.lastPeriodEndDate) return today;
    const lastEnd = parseISO(settings.lastPeriodEndDate);
    if (isNaN(lastEnd.getTime())) return today;
    anchorStart = addDays(lastEnd, -(settings.avgPeriodDuration - 1));
  }

  let cycleStart = anchorStart;
  while (!isAfter(addDays(cycleStart, settings.avgCycleLength), today)) {
    cycleStart = addDays(cycleStart, settings.avgCycleLength);
  }

  return cycleStart;
}

export function computePrediction(
  settings: UserSettings,
  today: Date = new Date()
): CyclePrediction {
  const cycleStart = estimateCycleStart(settings);
  const ovulationDay = getOvulationDay(settings.avgCycleLength);
  const currentDay = differenceInDays(today, cycleStart) + 1;

  // If the user logged a period day today (lastPeriodEndDate === today),
  // treat the menstrual phase as still active regardless of avgPeriodDuration.
  const todayStr = format(today, 'yyyy-MM-dd');
  const isPeriodActiveToday = settings.lastPeriodEndDate === todayStr;
  const effectivePeriodDuration = (isPeriodActiveToday && currentDay > settings.avgPeriodDuration)
    ? currentDay
    : settings.avgPeriodDuration;

  const phase = getPhaseForDay(
    currentDay,
    effectivePeriodDuration,
    ovulationDay,
    settings.avgCycleLength
  );

  const nextPeriodDate = addDays(cycleStart, settings.avgCycleLength);
  const ovulationDate = addDays(cycleStart, ovulationDay - 1);
  const daysUntilNextPeriod = differenceInDays(nextPeriodDate, today);
  const phaseStartDay = getPhaseStartDay(phase, effectivePeriodDuration, ovulationDay);

  // Irregular cycle range — use stored min/max if available
  let nextPeriodEarliestDate: string | null = null;
  let nextPeriodLatestDate: string | null = null;
  let daysUntilEarliest: number | null = null;
  let daysUntilLatest: number | null = null;

  const minLen = settings.minCycleLength;
  const maxLen = settings.maxCycleLength;
  if (settings.isIrregular && minLen && maxLen && minLen < maxLen) {
    const earliest = addDays(cycleStart, minLen);
    const latest = addDays(cycleStart, maxLen);
    nextPeriodEarliestDate = format(earliest, 'yyyy-MM-dd');
    nextPeriodLatestDate = format(latest, 'yyyy-MM-dd');
    daysUntilEarliest = Math.max(0, differenceInDays(earliest, today));
    daysUntilLatest = Math.max(0, differenceInDays(latest, today));
  }

  return {
    currentPhase: phase,
    currentCycleStartDate: format(cycleStart, 'yyyy-MM-dd'),
    nextPeriodDate: format(nextPeriodDate, 'yyyy-MM-dd'),
    nextPeriodEarliestDate,
    nextPeriodLatestDate,
    ovulationDate: format(ovulationDate, 'yyyy-MM-dd'),
    ovulationWindowStart: format(addDays(ovulationDate, -2), 'yyyy-MM-dd'),
    ovulationWindowEnd: format(addDays(ovulationDate, 1), 'yyyy-MM-dd'),
    daysUntilNextPeriod: Math.max(0, daysUntilNextPeriod),
    daysUntilEarliest,
    daysUntilLatest,
    currentCycleDay: currentDay,
    phaseDay: Math.max(1, currentDay - phaseStartDay + 1),
    phaseTotalDays: getPhaseDuration(
      phase,
      effectivePeriodDuration,
      ovulationDay,
      settings.avgCycleLength
    ),
    phaseLabel: phase.charAt(0).toUpperCase() + phase.slice(1) + ' Phase',
    isIrregular: settings.isIrregular,
  };
}

export function computeAdaptiveCycleLength(cycles: CycleRecord[]): number {
  const lengths = cycles
    .filter((c) => c.cycleLength !== null && c.cycleLength > 0)
    .slice(0, 6)  // cycles are DESC (newest first) from getRecentCycles
    .map((c) => c.cycleLength!);

  if (lengths.length < 2) return 28;

  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const stddev = Math.sqrt(
    lengths.map((l) => (l - mean) ** 2).reduce((a, b) => a + b, 0) /
      lengths.length
  );
  const filtered = lengths.filter((l) => Math.abs(l - mean) <= 2 * stddev);
  return Math.round(filtered.reduce((a, b) => a + b, 0) / filtered.length);
}

/**
 * Returns true if the given completed cycle lengths indicate an irregular
 * cycle pattern (stddev > threshold).
 */
export function detectIrregularity(lengths: number[]): boolean {
  if (lengths.length < 3) return false;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const stddev = Math.sqrt(
    lengths.map((l) => (l - mean) ** 2).reduce((a, b) => a + b, 0) /
      lengths.length
  );
  return stddev > IRREGULARITY_STDDEV_THRESHOLD;
}

export function getPhaseForDate(
  date: string,
  settings: UserSettings
): CyclePhase {
  const prediction = computePrediction(settings, parseISO(date));
  return prediction.currentPhase;
}
