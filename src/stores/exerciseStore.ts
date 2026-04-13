import { create } from 'zustand';
import {
  getSessionDateSet,
  calculateStreak,
  lastNDates,
} from '../db/repositories/exerciseRepository';

interface ExerciseState {
  streak: number;
  last7: string[];       // YYYY-MM-DD strings for last 7 days
  sessionDates: Set<string>;
  load: () => Promise<void>;
}

export const useExerciseStore = create<ExerciseState>((set) => ({
  streak: 0,
  last7: [],
  sessionDates: new Set(),

  load: async () => {
    const sessionDates = await getSessionDateSet();
    const streak = calculateStreak(sessionDates);
    const last7 = lastNDates(7);
    set({ streak, last7, sessionDates });
  },
}));
