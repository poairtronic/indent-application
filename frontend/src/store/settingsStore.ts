import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  dataDensity: 'compact' | 'comfortable';
  emailNotifications: boolean;
  workflowAlerts: boolean;
  costDeviationWarnings: boolean;
  timezone: string;
  currencyFormat: string;
  updateSettings: (
    partial: Partial<Omit<SettingsState, 'updateSettings' | 'resetSettings'>>,
  ) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  dataDensity: 'comfortable' as const,
  emailNotifications: true,
  workflowAlerts: true,
  costDeviationWarnings: true,
  timezone: 'ist',
  currencyFormat: 'inr',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (partial) => set((state) => ({ ...state, ...partial })),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'imcms_enterprise_settings',
    },
  ),
);
