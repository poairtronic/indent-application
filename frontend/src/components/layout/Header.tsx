import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/theme.store';
import { useNotifications } from '../../store/notification.store';
import { NotificationDrawer } from './NotificationDrawer';
import { CommandPalette } from './CommandPalette';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();
  const { notifications } = useNotifications();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const pathnames = location.pathname.split('/').filter((x) => x);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const environment = import.meta.env.VITE_APP_ENV || 'DEV';

  // Listen to Ctrl + K command
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-16 border-b border-border-default topbar-glass px-6 flex items-center justify-between font-sans transition-colors duration-300 sticky top-0 z-40">
        {/* Left Side: Breadcrumbs & Environment */}
        <div className="flex items-center space-x-3">
          {/* Environment Badge */}
          <span className="text-[9px] font-extrabold px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-md border border-accent-primary/20 uppercase tracking-wider">
            {environment}
          </span>
          <span className="text-border-default">|</span>
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1.5 text-xs">
            <Link
              to="/dashboard"
              className="text-text-muted hover:text-text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-surface-elevated"
            >
              Home
            </Link>
            {pathnames.map((name, index) => {
              const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              const displayLabel = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');

              return (
                <React.Fragment key={routeTo}>
                  <span className="text-text-disabled">/</span>
                  {isLast ? (
                    <span className="text-text-primary font-semibold px-1.5 py-0.5 bg-surface-elevated rounded">
                      {displayLabel}
                    </span>
                  ) : (
                    <Link
                      to={routeTo}
                      className="text-text-muted hover:text-text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-surface-elevated"
                    >
                      {displayLabel}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-4 max-w-xs w-full mx-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full bg-background-primary/60 hover:bg-background-secondary/80 border border-border-default hover:border-border-strong rounded-lg px-3 py-1.5 text-xs text-text-muted outline-none flex items-center justify-between transition-all duration-200 ease-enter shadow-card hover:shadow-dropdown focus-visible:ring-2 focus-visible:ring-accent-primary/30 focus-visible:border-accent-primary"
          >
            <span className="flex items-center gap-2">
              <Lucide.Search className="w-3.5 h-3.5 text-text-muted" />
              <span>Search console...</span>
            </span>
            <span className="text-[10px] bg-surface-elevated/80 text-text-muted px-1.5 py-0.5 rounded border border-border-default font-mono">
              Ctrl + K
            </span>
          </button>
        </div>

        {/* Right Side: Quick Actions & Profile */}
        <div className="flex items-center space-x-2">
          {/* Quick Actions Shortcuts */}
          <div className="hidden sm:flex items-center space-x-1 border-r border-border-default pr-3">
            <button
              onClick={() => navigate('/indents')}
              className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
              title="New Indent Dispatch"
              aria-label="New Indent Dispatch"
            >
              <Lucide.PlusCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/security')}
              className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
              title="Security Shield Logs"
              aria-label="Security Shield Logs"
            >
              <Lucide.ShieldCheck className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Mode Selector */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Lucide.Sun className="w-4 h-4" />
            ) : (
              <Lucide.Moon className="w-4 h-4" />
            )}
          </button>

          {/* Notifications Notification Drawer Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
              title="Toggle notifications panel"
              aria-label="Toggle notifications panel"
              aria-expanded={isNotificationsOpen}
            >
              <Lucide.Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full animate-pulse" />
              )}
            </button>
          </div>

          {/* Profile Controls */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
              aria-label="Open user menu"
              aria-expanded={isProfileOpen}
            >
              <div className="w-7 h-7 rounded-full bg-accent-primary flex items-center justify-center text-white text-xs font-bold ring-2 ring-accent-primary/20">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-surface-card border border-border-default rounded-xl shadow-modal py-1 z-20 font-sans overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-default bg-surface-elevated/50">
                    <p className="text-xs font-bold text-text-primary">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[9px] text-text-muted uppercase mt-0.5 tracking-wider">
                      {user?.role?.roleName}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                  >
                    <Lucide.User className="w-3.5 h-3.5" />
                    My Profile
                  </Link>
                  <Link
                    to="/security"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                  >
                    <Lucide.Shield className="w-3.5 h-3.5" />
                    Security Settings
                  </Link>
                  <div className="border-t border-border-default my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-status-error hover:bg-status-error/10 transition-colors focus:outline-none"
                  >
                    <Lucide.LogOut className="w-3.5 h-3.5" />
                    Logout Session
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Notification Drawer Overlay */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Command Palette search console */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
