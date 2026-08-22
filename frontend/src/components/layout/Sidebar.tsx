import React, { useState } from 'react';
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
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSidebar } from '../../store/sidebar.store';
import { useNavigationStore } from '../../store/navigation.store';
import { menuItems } from '../../config/menuConfig';
import { usePrefetch } from '../../hooks/usePrefetch';

const iconMap: Record<string, React.ComponentType<any>> = {
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
};

const renderIcon = (name: string, className: string) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) return <HelpCircle className={className} />;
  return <IconComponent className={className} />;
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { prefetchPath } = usePrefetch();
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
        isOpen ? 'w-72' : 'w-16'
      } ${isMobileOpen ? 'fixed inset-0 z-50' : 'hidden md:flex'}`}
    >
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-border-default flex items-center justify-between min-h-[70px]">
        {isOpen ? (
          <>
            <div
              onClick={() => handleNavigate('/dashboard')}
              onMouseEnter={() => prefetchPath('/dashboard')}
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-primary to-[#5030E5] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-glow transition-transform group-hover:scale-105">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-base tracking-wider text-text-primary uppercase block leading-none">
                  MERC
                </span>
                <span className="text-[10px] text-text-muted font-medium tracking-normal block leading-tight mt-1 group-hover:text-text-secondary transition-colors">
                  Manufacturing Enterprise Resource &amp; Costing
                </span>
              </div>
            </div>
            <button
              onClick={() => toggleSidebar()}
              className="w-7 h-7 rounded-lg bg-surface-elevated/80 border border-border-default flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-surface-hover hover:border-accent-primary/50 shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 shrink-0 ml-1"
              title="Close Sidebar (<)"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-2">
            <button
              onClick={() => toggleSidebar()}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-primary to-[#5030E5] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-glow transition-transform hover:scale-105"
              title="Click to Open Sidebar"
              aria-label="Click to Open Sidebar"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              onClick={() => toggleSidebar()}
              className="w-6 h-6 rounded-md bg-surface-elevated/90 border border-border-default flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-surface-hover hover:border-accent-primary/50 shadow-xs transition-all focus:outline-none"
              title="Open Sidebar (>)"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
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
                onMouseEnter={() => prefetchPath(item.path)}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 ease-enter ${
                  isActive
                    ? 'bg-accent-primary/15 text-accent-primary font-bold shadow-xs border-l-4 border-accent-primary pl-2.5'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-accent-primary rounded-r-full hidden" />
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
                    <Star
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
                <Star className="w-3 h-3 text-accent-primary fill-accent-primary" />
                <span>Favorites</span>
              </span>
              <span>
                {isFavoritesOpen ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
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
                      onMouseEnter={() => prefetchPath(path)}
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
            <LogOut className="w-3.5 h-3.5 text-text-muted hover:text-status-error shrink-0 transition-colors" />
          )}
        </button>
      </div>
    </aside>
  );
};
