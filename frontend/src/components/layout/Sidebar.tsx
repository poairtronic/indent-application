import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Coins,
  GitFork,
  Factory,
  Boxes,
  PackageOpen,
  Layers,
  Wrench,
  Scale,
  Briefcase,
  FileText,
  BarChart3,
  Users,
  Shield,
  Lock,
  Monitor,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSidebar } from '../../store/sidebar.store';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
}

const sidebarIconClass = 'w-5 h-5 flex-shrink-0';

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard className={sidebarIconClass} />,
    permission: 'analytics.view',
  },
  {
    label: 'Indents',
    path: '/indents',
    icon: <FileSpreadsheet className={sidebarIconClass} />,
    permission: 'indent.view',
  },
  {
    label: 'Cost Sheets',
    path: '/cost-sheets',
    icon: <Coins className={sidebarIconClass} />,
    permission: 'costsheet.view',
  },
  {
    label: 'Workflow',
    path: '/workflow',
    icon: <GitFork className={sidebarIconClass} />,
    permission: 'workflow.view',
  },
  {
    label: 'Production',
    path: '/production',
    icon: <Factory className={sidebarIconClass} />,
    permission: 'production.view',
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: <Boxes className={sidebarIconClass} />,
    permission: 'inventory.view',
  },
  {
    label: 'Materials',
    path: '/materials',
    icon: <PackageOpen className={sidebarIconClass} />,
    permission: 'materials.view',
  },
  {
    label: 'Products',
    path: '/products',
    icon: <Layers className={sidebarIconClass} />,
    permission: 'products.view',
  },
  {
    label: 'Processes',
    path: '/manufacturing-processes',
    icon: <Wrench className={sidebarIconClass} />,
    permission: 'manufacturing-processes.view',
  },
  {
    label: 'Units',
    path: '/units',
    icon: <Scale className={sidebarIconClass} />,
    permission: 'units.view',
  },
  {
    label: 'Vendors',
    path: '/vendors',
    icon: <Briefcase className={sidebarIconClass} />,
    permission: 'vendors.view',
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: <FileText className={sidebarIconClass} />,
    permission: 'reports.view',
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: <BarChart3 className={sidebarIconClass} />,
    permission: 'analytics.view',
  },
  {
    label: 'Users',
    path: '/users',
    icon: <Users className={sidebarIconClass} />,
    permission: 'users.view',
  },
  {
    label: 'Roles',
    path: '/roles',
    icon: <Shield className={sidebarIconClass} />,
    permission: 'roles.view',
  },
  { label: 'Security', path: '/security', icon: <Lock className={sidebarIconClass} /> },
  { label: 'Sessions', path: '/sessions', icon: <Monitor className={sidebarIconClass} /> },
  {
    label: 'Login History',
    path: '/login-history',
    icon: <History className={sidebarIconClass} />,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <Settings className={sidebarIconClass} />,
    permission: 'settings.manage',
  },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const visibleItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <aside
      className={`bg-background-secondary border-r border-border-default h-screen transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-16'
      } ${isMobileOpen ? 'fixed inset-0 z-50' : 'hidden md:flex'}`}
    >
      {/* Sidebar Header with Pinned Toggle */}
      <div className="p-4 border-b border-border-default flex items-center justify-between min-h-[64px]">
        <span
          className={`font-bold text-sm tracking-wide text-text-primary ${isOpen ? 'block' : 'hidden'}`}
        >
          IMCMS Enterprise
        </span>
        {!isOpen && (
          <span className="block text-center text-sm font-bold text-accent-primary">IE</span>
        )}
        <button
          onClick={() => toggleSidebar()}
          className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-elevated transition-colors"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar Links */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-border-default">
        {visibleItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-all duration-150 border-l-2 ${
                isActive
                  ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:bg-surface-card hover:text-text-primary'
              }`}
              title={!isOpen ? item.label : undefined}
            >
              {item.icon}
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border-default min-h-[64px] flex items-center justify-center">
        <button
          onClick={() => navigate('/profile')}
          className={`flex items-center gap-3 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors w-full ${
            !isOpen ? 'justify-center' : ''
          }`}
          title={!isOpen ? 'View Profile' : undefined}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span>My Profile</span>}
        </button>
      </div>
    </aside>
  );
};
