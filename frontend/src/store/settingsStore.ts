import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DataDensity = 'compact' | 'comfortable';
export type CurrencyFormat = 'inr' | 'usd' | 'eur';
export type TimezoneKey = 'ist' | 'utc' | 'est';

export interface SettingsState {
  // Appearance
  dataDensity: DataDensity;
  // Notifications
  emailNotifications: boolean;
  workflowAlerts: boolean;
  costDeviationWarnings: boolean;
  // Regional
  timezone: TimezoneKey;
  currencyFormat: CurrencyFormat;
  // Actions
  updateSettings: (
    partial: Partial<Omit<SettingsState, 'updateSettings' | 'resetSettings'>>,
  ) => void;
  resetSettings: () => void;
}

export const DEFAULT_SETTINGS = {
  dataDensity: 'comfortable' as DataDensity,
  emailNotifications: true,
  workflowAlerts: true,
  costDeviationWarnings: true,
  timezone: 'ist' as TimezoneKey,
  currencyFormat: 'inr' as CurrencyFormat,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: (partial) => set((state) => ({ ...state, ...partial })),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      // v2 key busts stale v1 localStorage that had wrong currency default
      name: 'imcms_enterprise_settings_v2',
    },
  ),
);
