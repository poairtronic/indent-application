import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Define custom mapping for breadcrumb labels if needed
  const breadcrumbNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    reports: 'Reports',
    'change-password': 'Change Password',
    security: 'Security',
    sessions: 'Sessions',
    'login-history': 'Login History',
    indents: 'Indents',
    'cost-sheets': 'Cost Sheets',
    create: 'Create',
    edit: 'Edit',
    materials: 'Materials',
    products: 'Products',
    vendors: 'Vendors',
    departments: 'Departments',
    users: 'Users',
    roles: 'Roles',
    permissions: 'Permissions',
    analytics: 'Analytics',
    workflow: 'Workflow',
    costs: 'Costs',
  };

  if (location.pathname === '/dashboard' || pathnames.length === 0) {
    return null; // Don't show breadcrumbs on the main dashboard
  }

  return (
    <nav className="flex items-center text-sm font-medium text-text-muted mb-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-accent-primary transition-colors focus:outline-none"
        aria-label="Home"
      >
        <Home size={14} className="mr-1" />
      </Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        // Capitalize the first letter if not in map (e.g. for dynamic IDs)
        let name = breadcrumbNameMap[value];
        if (!name) {
          // If it looks like a MongoDB ID or UUID, just show a truncated version
          if (value.length > 20) {
            name = `#${value.substring(0, 6)}...`;
          } else {
            name = value.charAt(0).toUpperCase() + value.slice(1);
          }
        }

        return (
          <React.Fragment key={to}>
            <ChevronRight size={14} className="mx-1 text-text-disabled shrink-0" />
            {last ? (
              <span className="text-text-primary" aria-current="page">
                {name}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-accent-primary transition-colors focus:outline-none"
              >
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
