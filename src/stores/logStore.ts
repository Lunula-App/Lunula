import { create } from 'zustand';
import { DailyLog } from '../models/log';
import { getLogForDate, upsertLog, getRecentLogs } from '../db/repositories/logRepository';
import { todayDate } from '../db/client';
import { reconcileCycles } from '../services/cycleReconciler';
import { syncNotifications } from '../services/notificationService';
import { useSettingsStore } from './settingsStore';

interface LogState {
  todayLog: DailyLog | null;
  recentLogs: DailyLog[];
  isLoaded: boolean;
  loadToday: () => Promise<void>;
  loadRecent: () => Promise<void>;
  saveLog: (log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const useLogStore = create<LogState>((set) => ({
  todayLog: null,
  recentLogs: [],
  isLoaded: false,

  loadToday: async () => {
    const log = await getLogForDate(todayDate());
    set({ todayLog: log, isLoaded: true });
  },

  loadRecent: async () => {
    const logs = await getRecentLogs(90);
    set({ recentLogs: logs });
  },

  saveLog: async (log) => {
    const saved = await upsertLog(log);
    const today = todayDate();

    // Rebuild recent logs with the new entry
    const allLogs = await getRecentLogs(90);

    set((state) => ({
      recentLogs: allLogs,
      todayLog: log.date === today ? saved : state.todayLog,
    }));

    // Reconcile cycle records and update adaptive averages
    await reconcileCycles(allLogs);

    // Reload settings so the rest of the app picks up any updated averages
    await useSettingsStore.getState().load();

    // Reschedule the period reminder with the freshly updated prediction
    const updatedSettings = useSettingsStore.getState().settings;
    if (updatedSettings?.notifyPeriodReminder) {
      syncNotifications(updatedSettings).catch(() => {});
    }
  },
}));
