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

  const { favorites, recents, toggleFavorite, addRecent } = useNavigationStore();
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [isRecentsOpen, setIsRecentsOpen] = useState(true);

  const visibleItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  const handleNavigate = (path: string) => {
    addRecent(path);
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
        <span
          className={`font-bold text-xs tracking-wider text-text-primary uppercase ${isOpen ? 'block' : 'hidden'}`}
        >
          IMCMS Portal
        </span>
        {!isOpen && (
          <span className="block text-center text-sm font-bold text-accent-primary">IE</span>
        )}
        <button
          onClick={() => toggleSidebar()}
          className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-elevated transition-colors focus:outline-none"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? (
            <Lucide.ChevronLeft className="w-4 h-4" />
          ) : (
            <Lucide.ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
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
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ease-enter ${
                  isActive
                    ? 'bg-accent-primary/10 text-accent-primary font-semibold shadow-glow'
                    : 'text-text-secondary hover:bg-surface-card hover:text-text-primary'
                }`}
              >
                <button
                  onClick={() => handleNavigate(item.path)}
                  className="flex-1 flex items-center gap-3 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
                  title={!isOpen ? item.label : undefined}
                >
                  {renderIcon(item.iconName, 'w-4 h-4 flex-shrink-0')}
                  {isOpen && <span>{item.label}</span>}
                </button>

                {isOpen && (
                  <button
                    onClick={() => toggleFavorite(item.path)}
                    className={`ml-2 text-text-muted hover:text-accent-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 rounded ${
                      isFav
                        ? 'text-accent-primary opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Lucide.Star
                      className={`w-3 h-3 ${isFav ? 'fill-accent-primary text-accent-primary' : 'text-text-muted'}`}
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

        {/* Collapsible Recents */}
        {isOpen && recents.length > 0 && (
          <div className="mt-4 border-t border-border-default pt-2">
            <button
              onClick={() => setIsRecentsOpen(!isRecentsOpen)}
              className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
            >
              <span className="flex items-center gap-1.5">
                <Lucide.History className="w-3 h-3 text-accent-primary" />
                <span>Recent Pages</span>
              </span>
              <span>
                {isRecentsOpen ? (
                  <Lucide.ChevronDown className="w-3 h-3" />
                ) : (
                  <Lucide.ChevronRight className="w-3 h-3" />
                )}
              </span>
            </button>
            {isRecentsOpen && (
              <div className="mt-1 space-y-0.5">
                {recents.map((path) => {
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

      {/* Footer Profile Shortcut */}
      <div className="p-4 border-t border-border-default min-h-[64px] flex items-center justify-between">
        <button
          onClick={() => handleNavigate('/profile')}
          className={`flex items-center gap-3 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors ${
            !isOpen ? 'justify-center w-full' : ''
          }`}
          title={!isOpen ? 'View Profile' : undefined}
        >
          <Lucide.User className="w-5 h-5 flex-shrink-0" />
          {isOpen && (
            <div className="text-left truncate max-w-[120px]">
              <p className="font-semibold text-text-primary truncate">
                {user?.firstName || 'My'} Profile
              </p>
              <p className="text-[10px] text-text-muted uppercase truncate">
                {user?.role?.roleName || 'User'}
              </p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
