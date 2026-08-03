import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

interface SidebarItem {
  label: string;
  path: string;
}

const settingsNavItems: SidebarItem[] = [
  { label: 'Edit Profile', path: '/profile' },
  { label: 'Change Password', path: '/change-password' },
  { label: 'Security Dashboard', path: '/security' },
  { label: 'Active Sessions', path: '/sessions' },
  { label: 'Login History Logs', path: '/login-history' },
];

export const SettingsLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans">
      {/* Settings Sub-Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-surface-card border border-border-default rounded-xl p-4 self-start">
        <h3 className="text-sm font-semibold text-text-muted px-3 mb-3 uppercase tracking-wider">
          System Settings
        </h3>
        <nav className="space-y-1">
          {settingsNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent-primary text-white'
                    : 'text-text-secondary hover:bg-[#111827] hover:text-text-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Settings Content Area */}
      <main className="flex-1 bg-surface-card border border-border-default rounded-xl p-6 shadow-card">
        <Outlet />
      </main>
    </div>
  );
};
