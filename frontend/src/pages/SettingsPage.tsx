import React, { useState, useCallback, useEffect } from 'react';
import { FormField } from '../components/ui/FormField';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { Button } from '../components/ui/Button';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  Bell,
  BellOff,
  AlertTriangle,
  Globe,
  Monitor,
  Layers,
} from 'lucide-react';
import { useThemeStore } from '../store/theme.store';
import { useSettingsStore, DEFAULT_SETTINGS } from '../store/settingsStore';
import type { DataDensity, CurrencyFormat, TimezoneKey } from '../store/settingsStore';
import { useToasts, ToastViewport } from '../components/ui/toast';
import { getTimezoneLabel } from '../utils/currencyFormatter';

// ─── helpers ──────────────────────────────────────────────────────────────────

function useUnsavedChanges(store: ReturnType<typeof useSettingsStore>) {
  const [dirty, setDirty] = useState(false);
  const [snapshot, setSnapshot] = useState(() => ({
    dataDensity: store.dataDensity,
    emailNotifications: store.emailNotifications,
    workflowAlerts: store.workflowAlerts,
    costDeviationWarnings: store.costDeviationWarnings,
    timezone: store.timezone,
    currencyFormat: store.currencyFormat,
  }));

  const reset = useCallback(() => {
    setDirty(false);
    setSnapshot({
      dataDensity: store.dataDensity,
      emailNotifications: store.emailNotifications,
      workflowAlerts: store.workflowAlerts,
      costDeviationWarnings: store.costDeviationWarnings,
      timezone: store.timezone,
      currencyFormat: store.currencyFormat,
    });
  }, [store]);

  const markDirty = useCallback(() => setDirty(true), []);

  return { dirty, markDirty, reset, snapshot };
}

// ─── component ────────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const settings = useSettingsStore();
  const { toasts, show, dismiss } = useToasts();
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const { dirty, markDirty, reset } = useUnsavedChanges(settings);

  // ── helpers ──────────────────────────────────────────────────────────────

  const updateField = useCallback(
    <K extends keyof typeof DEFAULT_SETTINGS>(key: K, value: (typeof DEFAULT_SETTINGS)[K]) => {
      settings.updateSettings({ [key]: value } as any);
      markDirty();
    },
    [settings, markDirty],
  );

  const handleToggle = useCallback(
    (
      key: 'emailNotifications' | 'workflowAlerts' | 'costDeviationWarnings',
      value: boolean,
    ) => {
      settings.updateSettings({ [key]: value });
      markDirty();

      const labels: Record<string, string> = {
        emailNotifications: 'Email Notifications',
        workflowAlerts: 'Workflow Alerts',
        costDeviationWarnings: 'Cost Deviation Warnings',
      };
      if (value) {
        show('success', `${labels[key]} enabled.`);
      } else {
        show('warning', `${labels[key]} disabled. You may miss important alerts.`);
      }
    },
    [settings, markDirty, show],
  );

  // ── save ─────────────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    setIsSaving(true);
    // Settings are already persisted via Zustand persist on every onChange.
    // "Save" just confirms the batch and resets dirty state.
    setTimeout(() => {
      setIsSaving(false);
      setSavedAt(new Date());
      reset();
      show('success', 'Enterprise configuration saved successfully.');
    }, 400);
  }, [reset, show]);

  const handleReset = useCallback(() => {
    settings.resetSettings();
    setTheme('system');
    reset();
    show('info', 'Settings have been reset to factory defaults.');
  }, [settings, setTheme, reset, show]);

  // Apply dataDensity to <html> immediately when changed
  useEffect(() => {
    document.documentElement.setAttribute('data-density', settings.dataDensity);
  }, [settings.dataDensity]);

  // ── ui ───────────────────────────────────────────────────────────────────

  const allNotificationsOff =
    !settings.emailNotifications &&
    !settings.workflowAlerts &&
    !settings.costDeviationWarnings;

  return (
    <div className="max-w-4xl animate-fade-in">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">System Configuration</h2>
          <p className="text-text-secondary text-sm">
            Manage enterprise global settings, notifications, and application preferences.
          </p>
        </div>
        {savedAt && !dirty && (
          <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
            <CheckCircle2 size={13} />
            Saved {savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* All-notifications-off banner */}
      {allNotificationsOff && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-xs font-medium">
          <BellOff size={14} className="shrink-0" />
          All notification channels are currently disabled. You will not receive any system
          alerts or workflow updates.
        </div>
      )}

      <div className="space-y-8">
        {/* ── Appearance ────────────────────────────────────────────────── */}
        <section className="bg-background-primary p-6 rounded-xl border border-border-default">
          <div className="flex items-center gap-2 mb-4 border-b border-border-default pb-2">
            <Monitor size={15} className="text-accent-primary" />
            <h3 className="text-md font-semibold text-text-primary">Appearance & UI</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Theme Preference" hint="Select your preferred application theme">
              <Select
                options={[
                  { label: 'System Default', value: 'system' },
                  { label: 'Enterprise Light', value: 'light' },
                  { label: 'Enterprise Dark', value: 'dark' },
                ]}
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value as any);
                  markDirty();
                }}
              />
            </FormField>

            <FormField label="Data Density" hint="Adjust the density of tables and lists">
              <Select
                options={[
                  { label: 'Comfortable', value: 'comfortable' },
                  { label: 'Compact', value: 'compact' },
                ]}
                value={settings.dataDensity}
                onChange={(e) => updateField('dataDensity', e.target.value as DataDensity)}
              />
            </FormField>
          </div>
        </section>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <section className="bg-background-primary p-6 rounded-xl border border-border-default">
          <div className="flex items-center gap-2 mb-4 border-b border-border-default pb-2">
            <Bell size={15} className="text-accent-primary" />
            <h3 className="text-md font-semibold text-text-primary">Notifications & Alerts</h3>
            {allNotificationsOff && (
              <span className="ml-auto text-[10px] font-semibold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <BellOff size={10} />
                All Off
              </span>
            )}
          </div>
          <div className="space-y-3">
            {/* Email Notifications */}
            <div
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                settings.emailNotifications
                  ? 'border-border-default bg-surface-card'
                  : 'border-yellow-500/20 bg-yellow-500/5'
              }`}
            >
              <Switch
                label="Email Notifications"
                description="Receive daily digests of your tasks and pending items"
                checked={settings.emailNotifications}
                onChange={(e) => handleToggle('emailNotifications', e.target.checked)}
              />
            </div>

            {/* Workflow Alerts */}
            <div
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                settings.workflowAlerts
                  ? 'border-border-default bg-surface-card'
                  : 'border-yellow-500/20 bg-yellow-500/5'
              }`}
            >
              <Switch
                label="Workflow Alerts"
                description="Instant in-app alerts when an indent requires your attention"
                checked={settings.workflowAlerts}
                onChange={(e) => handleToggle('workflowAlerts', e.target.checked)}
              />
            </div>

            {/* Cost Deviation Warnings */}
            <div
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                settings.costDeviationWarnings
                  ? 'border-border-default bg-surface-card'
                  : 'border-yellow-500/20 bg-yellow-500/5'
              }`}
            >
              <Switch
                label="Cost Deviation Warnings"
                description="Alert when a cost sheet exceeds predicted budget by > 10%"
                checked={settings.costDeviationWarnings}
                onChange={(e) => handleToggle('costDeviationWarnings', e.target.checked)}
              />
            </div>
          </div>

          {/* Notification status summary */}
          <div className="mt-4 pt-3 border-t border-border-default grid grid-cols-3 gap-3">
            {[
              { key: 'emailNotifications', label: 'Email', value: settings.emailNotifications },
              { key: 'workflowAlerts', label: 'Workflow', value: settings.workflowAlerts },
              {
                key: 'costDeviationWarnings',
                label: 'Cost Alerts',
                value: settings.costDeviationWarnings,
              },
            ].map(({ key, label, value }) => (
              <div
                key={key}
                className={`flex items-center gap-2 text-[11px] font-semibold rounded-lg px-3 py-2 ${
                  value
                    ? 'text-green-400 bg-green-400/10'
                    : 'text-text-muted bg-background-secondary'
                }`}
              >
                {value ? (
                  <Bell size={11} className="shrink-0" />
                ) : (
                  <BellOff size={11} className="shrink-0" />
                )}
                {label}: {value ? 'On' : 'Off'}
              </div>
            ))}
          </div>
        </section>

        {/* ── Regional Settings ─────────────────────────────────────────── */}
        <section className="bg-background-primary p-6 rounded-xl border border-border-default">
          <div className="flex items-center gap-2 mb-4 border-b border-border-default pb-2">
            <Globe size={15} className="text-accent-primary" />
            <h3 className="text-md font-semibold text-text-primary">Regional Settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Timezone"
              hint={getTimezoneLabel(settings.timezone)}
            >
              <Select
                options={[
                  { label: 'Asia/Kolkata (IST)', value: 'ist' },
                  { label: 'UTC', value: 'utc' },
                  { label: 'America/New_York (EST)', value: 'est' },
                ]}
                value={settings.timezone}
                onChange={(e) => updateField('timezone', e.target.value as TimezoneKey)}
              />
            </FormField>

            <FormField
              label="Currency Format"
              hint={
                settings.currencyFormat === 'inr'
                  ? 'Indian Rupee — used for all cost displays'
                  : settings.currencyFormat === 'usd'
                    ? 'US Dollar — cost displays in USD'
                    : 'Euro — cost displays in EUR'
              }
            >
              <Select
                options={[
                  { label: 'Indian Rupee (₹)', value: 'inr' },
                  { label: 'US Dollar ($)', value: 'usd' },
                  { label: 'Euro (€)', value: 'eur' },
                ]}
                value={settings.currencyFormat}
                onChange={(e) => updateField('currencyFormat', e.target.value as CurrencyFormat)}
              />
            </FormField>
          </div>

          {/* Regional preview */}
          <div className="mt-4 pt-3 border-t border-border-default flex flex-wrap gap-4 text-xs text-text-secondary">
            <span>
              <span className="font-semibold text-text-primary">Currency preview:</span>{' '}
              {settings.currencyFormat === 'inr' && '₹42,839'}
              {settings.currencyFormat === 'usd' && '$42,839'}
              {settings.currencyFormat === 'eur' && '€42,839'}
            </span>
            <span>
              <span className="font-semibold text-text-primary">Date format:</span>{' '}
              {new Date().toLocaleDateString(
                settings.timezone === 'ist' ? 'en-IN' :
                settings.timezone === 'usd' ? 'en-US' : 'en-GB',
                { day: '2-digit', month: 'short', year: 'numeric' },
              )}
            </span>
          </div>
        </section>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-text-muted">
            {dirty ? (
              <span className="flex items-center gap-1.5 text-yellow-400">
                <AlertTriangle size={12} />
                You have unsaved changes
              </span>
            ) : savedAt ? (
              <span className="flex items-center gap-1.5 text-green-400">
                <CheckCircle2 size={12} />
                All changes saved
              </span>
            ) : (
              <span>Settings auto-save as you change them</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon={<RotateCcw size={14} />}
              onClick={handleReset}
            >
              Reset Defaults
            </Button>
            <Button
              icon={<Save size={16} />}
              onClick={handleSave}
              loading={isSaving}
              disabled={!dirty}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
