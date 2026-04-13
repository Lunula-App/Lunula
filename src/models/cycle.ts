export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface UserSettings {
  id: 1;
  avgCycleLength: number;
  avgPeriodDuration: number;
  lastPeriodEndDate: string;   // ISO date YYYY-MM-DD
  lastPeriodStartDate: string;
  pinHash: string | null;
  biometricEnabled: boolean;
  syncProvider: 'none' | 'google_drive' | 'icloud';
  syncEnabled: boolean;
  lastSyncAt: string | null;
  onboardingComplete: boolean;
  darkMode: 'system' | 'light' | 'dark';
  accentColor: string;
  isIrregular: boolean;
  minCycleLength: number | null;
  maxCycleLength: number | null;
  notifyDailyLog: boolean;
  notifyDailyLogTime: string;       // HH:MM
  notifyPeriodReminder: boolean;
  notifyPeriodDaysBefore: number;
  notifyKegel: boolean;
  notifyKegelTime: string;           // HH:MM
  notifyBackup: boolean;
  notifyBackupIntervalWeeks: 1 | 2 | 4;
  createdAt: string;
  updatedAt: string;
}

export interface CyclePrediction {
  currentPhase: CyclePhase;
  currentCycleStartDate: string;
  nextPeriodDate: string;
  nextPeriodEarliestDate: string | null;  // irregular: earliest possible
  nextPeriodLatestDate: string | null;    // irregular: latest possible
  ovulationDate: string;
  ovulationWindowStart: string;
  ovulationWindowEnd: string;
  daysUntilNextPeriod: number;
  daysUntilEarliest: number | null;
  daysUntilLatest: number | null;
  currentCycleDay: number;
  phaseDay: number;
  phaseTotalDays: number;
  phaseLabel: string;
  isIrregular: boolean;
}

export interface CycleRecord {
  id: string;
  startDate: string;
  endDate: string | null;
  cycleLength: number | null;
  periodDuration: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
};

export const PHASE_DESCRIPTIONS: Record<CyclePhase, string> = {
  menstrual: 'Your period — rest, restore, and be gentle with yourself.',
  follicular: 'Energy rising — great time to start new things.',
  ovulatory: 'Peak energy and confidence — your most social phase.',
  luteal: 'Winding down — turn inward, prepare for rest.',
};
