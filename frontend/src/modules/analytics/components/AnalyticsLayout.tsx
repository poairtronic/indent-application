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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-700 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">{title}</h1>
          {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-800">
        <nav className="flex space-x-8 -mb-px overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/analytics'}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:border-slate-300 hover:text-slate-200'
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
