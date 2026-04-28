import { differenceInDays, parseISO } from 'date-fns';
import { getEarliestLogDate } from '../db/repositories/logRepository';

export type ProgressionLevel = 1 | 2 | 3;

const LEVEL_2_DAYS = 28;   // 4 weeks
const LEVEL_3_DAYS = 84;   // 12 weeks

export async function getUserProgressionLevel(): Promise<ProgressionLevel> {
  const earliest = await getEarliestLogDate();
  if (!earliest) return 1;

  const days = differenceInDays(new Date(), parseISO(earliest));
  if (days >= LEVEL_3_DAYS) return 3;
  if (days >= LEVEL_2_DAYS) return 2;
  return 1;
}

export function progressionLevelLabel(level: ProgressionLevel): string {
  switch (level) {
    case 1: return 'Foundation';
    case 2: return 'Building';
    case 3: return 'Advanced';
  }
}
