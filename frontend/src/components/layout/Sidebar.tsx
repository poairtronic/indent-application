import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSidebar } from '../../store/sidebar.store';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <span>📊</span>, permission: 'analytics.view' },
  { label: 'Indents', path: '/indents', icon: <span>📋</span>, permission: 'indent.view' },
  {
    label: 'Cost Sheets',
    path: '/cost-sheets',
    icon: <span>💰</span>,
    permission: 'costsheet.view',
  },
  { label: 'Workflow', path: '/workflow', icon: <span>🔄</span>, permission: 'workflow.view' },
  {
    label: 'Production',
    path: '/production',
    icon: <span>🏭</span>,
    permission: 'production.view',
  },
  { label: 'Inventory', path: '/inventory', icon: <span>📦</span>, permission: 'inventory.view' },
  { label: 'Materials', path: '/materials', icon: <span>🧱</span>, permission: 'materials.view' },
  { label: 'Products', path: '/products', icon: <span>⚙️</span>, permission: 'products.view' },
  { label: 'Vendors', path: '/vendors', icon: <span>🏢</span>, permission: 'vendors.view' },
  { label: 'Reports', path: '/reports', icon: <span>📈</span>, permission: 'reports.view' },
  { label: 'Analytics', path: '/analytics', icon: <span>📉</span>, permission: 'analytics.view' },
  { label: 'Users', path: '/users', icon: <span>👥</span>, permission: 'users.view' },
  { label: 'Roles', path: '/roles', icon: <span>🔐</span>, permission: 'roles.view' },
  { label: 'Security', path: '/security', icon: <span>🛡️</span> },
  { label: 'Sessions', path: '/sessions', icon: <span>🔌</span> },
  { label: 'Login History', path: '/login-history', icon: <span>📜</span> },
  { label: 'Settings', path: '/settings', icon: <span>⚙️</span>, permission: 'settings.manage' },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen } = useSidebar();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const visibleItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <aside
      className={`bg-gray-900 text-white h-screen transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-16'
      } ${isMobileOpen ? 'fixed inset-0 z-50' : 'hidden md:flex'}`}
    >
      <div className="p-4 border-b border-gray-700">
        <h2 className={`font-bold text-lg ${isOpen ? 'block' : 'hidden'}`}>Indent System</h2>
        {!isOpen && <span className="block text-center text-lg font-bold">IS</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={!isOpen ? item.label : undefined}
            >
              <span className="flex-shrink-0 text-lg">{item.icon}</span>
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => navigate('/profile')}
          className={`flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors w-full ${
            !isOpen ? 'justify-center' : ''
          }`}
        >
          <span>👤</span>
          {isOpen && <span>Profile</span>}
        </button>
      </div>
    </aside>
  );
};
