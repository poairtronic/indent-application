import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSidebar } from '../../store/sidebar.store';
import { useNavigationStore } from '../../store/navigation.store';
import { menuItems } from '../../config/menuConfig';

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard: Lucide.LayoutDashboard,
  FileSpreadsheet: Lucide.FileSpreadsheet,
  Coins: Lucide.Coins,
  GitFork: Lucide.GitFork,
  Factory: Lucide.Factory,
  Boxes: Lucide.Boxes,
  PackageOpen: Lucide.PackageOpen,
  Layers: Lucide.Layers,
  Wrench: Lucide.Wrench,
  Scale: Lucide.Scale,
  Briefcase: Lucide.Briefcase,
  FileText: Lucide.FileText,
  BarChart3: Lucide.BarChart3,
  Users: Lucide.Users,
  Shield: Lucide.Shield,
  Lock: Lucide.Lock,
  Monitor: Lucide.Monitor,
  History: Lucide.History,
  Settings: Lucide.Settings,
};

const renderIcon = (name: string, className: string) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) return <Lucide.HelpCircle className={className} />;
  return <IconComponent className={className} />;
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const user = useAuthStore((s) => s.user);

  const { favorites, toggleFavorite } = useNavigationStore();
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);

  const visibleItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    onCloseMobile?.();
  };

  return (
    <aside
      className={`bg-background-secondary border-r border-border-default h-screen transition-[width] duration-300 ease-enter flex flex-col ${
        isOpen ? 'w-64' : 'w-16'
      } ${isMobileOpen ? 'fixed inset-0 z-50' : 'hidden md:flex'}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border-default flex items-center justify-between min-h-[64px]">
        <div className={`flex items-center gap-3 ${isOpen ? '' : 'justify-center w-full'}`}>
          <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-glow">
            IE
          </div>
          {isOpen && (
            <div className="min-w-0">
              <span className="font-bold text-xs tracking-wider text-text-primary uppercase block truncate">
                IMCMS
              </span>
              <span className="text-[9px] text-text-muted uppercase tracking-widest block">
                Enterprise
              </span>
            </div>
          )}
        </div>
        {isOpen && (
          <button
            onClick={() => toggleSidebar()}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
            title="Collapse Sidebar"
          >
            <Lucide.ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
        {!isOpen && (
          <button
            onClick={() => toggleSidebar()}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 absolute right-2 top-4"
            title="Expand Sidebar"
          >
            <Lucide.ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {/* Primary Menus */}
        <div className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const isFav = favorites.includes(item.path);

            return (
              <div
                key={item.path}
                className={`group relative flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ease-enter ${
                  isActive
                    ? 'bg-accent-primary/10 text-accent-primary font-semibold'
                    : 'text-text-secondary hover:bg-surface-card hover:text-text-primary'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-accent-primary rounded-r-full" />
                )}
                <button
                  onClick={() => handleNavigate(item.path)}
                  className="flex-1 flex items-center gap-3 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
                  title={!isOpen ? item.label : undefined}
                >
                  {renderIcon(
                    item.iconName,
                    `w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-primary'}`,
                  )}
                  {isOpen && <span className="truncate">{item.label}</span>}
                </button>

                {isOpen && (
                  <button
                    onClick={() => toggleFavorite(item.path)}
                    className={`ml-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 rounded p-0.5 ${
                      isFav
                        ? 'text-accent-primary opacity-100'
                        : 'text-text-muted hover:text-accent-primary opacity-0 group-hover:opacity-100'
                    }`}
                    title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Lucide.Star
                      className={`w-3 h-3 ${isFav ? 'fill-accent-primary text-accent-primary' : ''}`}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Collapsible Favorites */}
        {isOpen && favorites.length > 0 && (
          <div className="mt-4 border-t border-border-default pt-2">
            <button
              onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
              className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
            >
              <span className="flex items-center gap-1.5">
                <Lucide.Star className="w-3 h-3 text-accent-primary fill-accent-primary" />
                <span>Favorites</span>
              </span>
              <span>
                {isFavoritesOpen ? (
                  <Lucide.ChevronDown className="w-3 h-3" />
                ) : (
                  <Lucide.ChevronRight className="w-3 h-3" />
                )}
              </span>
            </button>
            {isFavoritesOpen && (
              <div className="mt-1 space-y-0.5">
                {favorites.map((path) => {
                  const item = menuItems.find((m) => m.path === path);
                  if (!item) return null;
                  return (
                    <button
                      key={path}
                      onClick={() => handleNavigate(path)}
                      className="w-full flex items-center gap-3 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-card hover:text-text-primary text-left rounded transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
                    >
                      {renderIcon(item.iconName, 'w-3.5 h-3.5 flex-shrink-0 text-text-muted')}
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Profile Card */}
      <div className="p-3 border-t border-border-default">
        <button
          onClick={() => handleNavigate('/profile')}
          className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-xs font-medium transition-all duration-200 ease-enter hover:bg-surface-card ${
            !isOpen ? 'justify-center' : ''
          }`}
          title={!isOpen ? 'View Profile' : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-accent-primary/20">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          {isOpen && (
            <div className="text-left min-w-0 flex-1">
              <p className="font-semibold text-text-primary truncate text-xs">
                {user?.firstName || 'My'} {user?.lastName || 'Profile'}
              </p>
              <p className="text-[10px] text-text-muted truncate">
                {user?.role?.roleName || 'User'}
              </p>
            </div>
          )}
          {isOpen && (
            <Lucide.LogOut className="w-3.5 h-3.5 text-text-muted hover:text-status-error shrink-0 transition-colors" />
          )}
        </button>
      </div>
    </aside>
  );
};
