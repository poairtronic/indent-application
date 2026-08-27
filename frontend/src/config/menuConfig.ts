export interface MenuItem {
  label: string;
  path: string;
  iconName: string;
  permission?: string;
  roles?: string[];
}

export const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    iconName: 'LayoutDashboard',
    permission: 'analytics.view',
  },
  { label: 'Indents', path: '/indents', iconName: 'FileSpreadsheet', permission: 'indent.view' },
  { label: 'Cost Sheets', path: '/cost-sheets', iconName: 'Coins', permission: 'costsheet.view' },
  { label: 'Workflow', path: '/workflow', iconName: 'GitFork', permission: 'workflow.view' },
  { label: 'Production', path: '/production', iconName: 'Factory', permission: 'production.view' },
  { label: 'Materials', path: '/materials', iconName: 'PackageOpen', permission: 'materials.view' },
  { label: 'Products', path: '/products', iconName: 'Layers', permission: 'products.view' },
  {
    label: 'Processes',
    path: '/manufacturing-processes',
    iconName: 'Wrench',
    permission: 'manufacturing-processes.view',
  },
  { label: 'Units', path: '/units', iconName: 'Scale', permission: 'units.view' },
  { label: 'Vendors', path: '/vendors', iconName: 'Briefcase', permission: 'vendors.view' },
  { label: 'Reports', path: '/reports', iconName: 'FileText', permission: 'reports.view' },
  {
    label: 'Documents',
    path: '/documents',
    iconName: 'FolderArchive',
    permission: 'documents.view',
  },
  { label: 'Analytics', path: '/analytics', iconName: 'BarChart3', permission: 'analytics.view' },
  {
    label: 'Notifications',
    path: '/notifications',
    iconName: 'Bell',
    permission: 'notifications.view',
  },
  { label: 'Users', path: '/users', iconName: 'Users', permission: 'users.view' },
  { label: 'Roles', path: '/roles', iconName: 'Shield', permission: 'roles.view' },
  { label: 'Settings', path: '/profile', iconName: 'Settings' },
];

export const settingsMenuItems: MenuItem[] = [
  {
    label: 'System Configuration',
    path: '/settings',
    iconName: 'Settings',
    permission: 'settings.manage',
  },
  { label: 'Edit Profile', path: '/profile', iconName: 'User' },
  { label: 'Change Password', path: '/change-password', iconName: 'Lock' },
  { label: 'Security Dashboard', path: '/security', iconName: 'Shield' },
  { label: 'Active Sessions', path: '/sessions', iconName: 'Monitor' },
  { label: 'Login History', path: '/login-history', iconName: 'History' },
  {
    label: 'Audit Logs',
    path: '/audit-logs',
    iconName: 'FileText',
    permission: 'audit.view',
  },
  {
    label: 'Email & Communication',
    path: '/communication',
    iconName: 'Mail',
    permission: 'audit.view',
  },
  {
    label: 'System Monitoring',
    path: '/monitoring',
    iconName: 'Activity',
    permission: 'settings.manage',
  },
];
