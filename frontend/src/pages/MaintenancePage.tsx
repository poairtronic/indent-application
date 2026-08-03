import React from 'react';

export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-6 text-center font-sans transition-colors duration-300">
      <div className="max-w-md w-full bg-surface-card border border-border-default rounded-2xl p-8 shadow-modal">
        <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-3xl text-accent-primary">⚙️</span>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-4">System Maintenance</h2>
        <p className="text-sm text-text-secondary mb-6">
          The IMCMS portal is currently undergoing scheduled infrastructure upgrades. Services will
          be restored shortly. Thank you for your patience.
        </p>
        <div className="inline-flex items-center text-[10px] bg-background-primary text-text-muted px-2.5 py-1 rounded border border-border-default font-medium uppercase tracking-wider">
          System Maintenance Outage
        </div>
      </div>
    </div>
  );
};
