import { create } from 'zustand';
import { UserSettings } from '../models/cycle';
import { getSettings, saveSettings } from '../db/repositories/settingsRepository';

interface SettingsState {
  settings: UserSettings | null;
  isLoaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoaded: false,

  load: async () => {
    const settings = await getSettings();
    set({ settings, isLoaded: true });
  },

  update: async (partial) => {
    await saveSettings(partial);
    const updated = await getSettings();
    set({ settings: updated });
  },
}));
