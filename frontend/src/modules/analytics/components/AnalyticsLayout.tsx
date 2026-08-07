import React from 'react';
import { NavLink, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { logSecurityDenial } from '../../../utils/securityLogger';

interface AnalyticsLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AnalyticsLayout: React.FC<AnalyticsLayoutProps> = ({ children, title, subtitle }) => {
  const user = useAuthStore((s) => s.user);
  const userDept = user?.department?.departmentCode;
  const isAdmin = user?.permissions.includes('settings.manage');
  const isManager = userDept === 'SMGR' || userDept === 'GMGR';

  const location = useLocation();
  const currentPath = location.pathname;

  const isPathAllowed = React.useMemo(() => {
    if (
      currentPath === '/analytics' ||
      currentPath === '/analytics/workflow' ||
      currentPath === '/analytics/departments'
    ) {
      return true;
    }
    if (currentPath === '/analytics/costs') {
      return Boolean(isAdmin || isManager || userDept === 'ACCT');
    }
    if (currentPath === '/analytics/products') {
      return Boolean(isAdmin || isManager || userDept === 'DSGN' || userDept === 'STOR');
    }
    if (currentPath === '/analytics/vendors') {
      return Boolean(isAdmin || isManager || userDept === 'STOR' || userDept === 'ACCT');
    }
    return true;
  }, [currentPath, isAdmin, isManager, userDept]);

  React.useEffect(() => {
    if (!isPathAllowed) {
      logSecurityDenial('analytics.view', currentPath, 'ANALYTICS_TAB_ACCESS');
    }
  }, [isPathAllowed, currentPath]);

  if (!isPathAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  const tabs = React.useMemo(() => {
    const list = [
      { name: 'Summary', path: '/analytics' },
      { name: 'Workflow', path: '/analytics/workflow' },
      { name: 'Departments', path: '/analytics/departments' },
    ];

    if (isAdmin || isManager || userDept === 'ACCT') {
      list.push({ name: 'Costs', path: '/analytics/costs' });
    }

    if (isAdmin || isManager || userDept === 'DSGN' || userDept === 'STOR') {
      list.push({ name: 'Products', path: '/analytics/products' });
    }

    if (isAdmin || isManager || userDept === 'STOR' || userDept === 'ACCT') {
      list.push({ name: 'Vendors', path: '/analytics/vendors' });
    }

    return list;
  }, [isAdmin, isManager, userDept]);

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
