import React from 'react';
import { FormField } from '../components/ui/FormField';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { Button } from '../components/ui/Button';
import { Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">System Configuration</h2>
        <p className="text-text-secondary text-sm">
          Manage enterprise global settings, notifications, and application preferences.
        </p>
      </div>

      <div className="space-y-8">
        {/* Appearance Settings */}
        <section className="bg-background-primary p-6 rounded-xl border border-border-default">
          <h3 className="text-md font-semibold text-text-primary mb-4 border-b border-border-default pb-2">
            Appearance & UI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Theme Preference" hint="Select your preferred application theme">
              <Select
                options={[
                  { label: 'System Default', value: 'system' },
                  { label: 'Enterprise Light', value: 'light' },
                  { label: 'Enterprise Dark', value: 'dark' },
                ]}
                value="system"
                onChange={() => {}}
              />
            </FormField>

            <FormField label="Data Density" hint="Adjust the density of tables and lists">
              <Select
                options={[
                  { label: 'Compact', value: 'compact' },
                  { label: 'Comfortable', value: 'comfortable' },
                ]}
                value="comfortable"
                onChange={() => {}}
              />
            </FormField>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="bg-background-primary p-6 rounded-xl border border-border-default">
          <h3 className="text-md font-semibold text-text-primary mb-4 border-b border-border-default pb-2">
            Notifications & Alerts
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border-default bg-surface-card">
              <Switch
                label="Email Notifications"
                description="Receive daily digests of your tasks"
                checked={true}
                onChange={() => {}}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border-default bg-surface-card">
              <Switch
                label="Workflow Alerts"
                description="Instant alerts when an indent requires your attention"
                checked={true}
                onChange={() => {}}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border-default bg-surface-card">
              <Switch
                label="Cost Deviation Warnings"
                description="Alert when a cost sheet exceeds predicted budget by &gt; 10%"
                checked={true}
                onChange={() => {}}
              />
            </div>
          </div>
        </section>

        {/* System Settings */}
        <section className="bg-background-primary p-6 rounded-xl border border-border-default">
          <h3 className="text-md font-semibold text-text-primary mb-4 border-b border-border-default pb-2">
            Regional Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Timezone">
              <Select
                options={[
                  { label: 'Asia/Kolkata (IST)', value: 'ist' },
                  { label: 'UTC', value: 'utc' },
                  { label: 'America/New_York (EST)', value: 'est' },
                ]}
                value="ist"
                onChange={() => {}}
              />
            </FormField>

            <FormField label="Currency Format">
              <Select
                options={[
                  { label: 'Indian Rupee (₹)', value: 'inr' },
                  { label: 'US Dollar ($)', value: 'usd' },
                  { label: 'Euro (€)', value: 'eur' },
                ]}
                value="inr"
                onChange={() => {}}
              />
            </FormField>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline">Reset Defaults</Button>
          <Button icon={<Save size={16} />}>Save Configuration</Button>
        </div>
      </div>
    </div>
  );
};
