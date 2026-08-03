import React from 'react';
import { NavLink } from 'react-router-dom';

interface AnalyticsLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AnalyticsLayout: React.FC<AnalyticsLayoutProps> = ({ children, title, subtitle }) => {
  const tabs = [
    { name: 'Summary', path: '/analytics' },
    { name: 'Workflow', path: '/analytics/workflow' },
    { name: 'Departments', path: '/analytics/departments' },
    { name: 'Costs', path: '/analytics/costs' },
    { name: 'Products', path: '/analytics/products' },
    { name: 'Vendors', path: '/analytics/vendors' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-1">{title}</h1>
          {subtitle && <p className="text-text-muted text-sm">{subtitle}</p>}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-border-default">
        <nav className="flex space-x-8 -mb-px overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/analytics'}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-accent-primary text-accent-primary font-semibold'
                    : 'border-transparent text-text-muted hover:border-border-strong hover:text-text-secondary'
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Children view container */}
      <div className="pt-2">{children}</div>
    </div>
  );
};
