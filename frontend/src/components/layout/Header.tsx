import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  ShieldCheck,
  Sun,
  Moon,
  Bell,
  User,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/theme.store';
import { useUnreadNotificationCount } from '../../api/services/notifications/hooks';
const NotificationDrawer = lazy(() =>
  import('./NotificationDrawer').then((m) => ({ default: m.NotificationDrawer })),
);
const CommandPalette = lazy(() =>
  import('./CommandPalette').then((m) => ({ default: m.CommandPalette })),
);

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentTime(`${dateStr} ${timeStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const pathnames = location.pathname.split('/').filter((x) => x);
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
        <div className="flex items-center space-x-3 shrink-0">
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
                    <span className="font-semibold text-text-primary px-1.5 py-0.5 bg-surface-elevated rounded">
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

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 lg:mx-8 hidden sm:flex justify-center">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl border border-border-default bg-surface-card hover:border-accent-primary/50 text-text-muted hover:text-text-secondary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 shadow-xs cursor-pointer group"
            aria-label="Open search dialog"
          >
            <Search className="w-4 h-4 text-text-muted group-hover:text-accent-primary transition-colors shrink-0" />
            <span className="text-xs text-text-muted group-hover:text-text-secondary truncate transition-colors">
              Search indents, materials, products...
            </span>
          </button>
        </div>

        {/* Right Side: Quick Actions & Profile */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Quick Create Button */}
          <Link
            to="/indents/create"
            className="hidden sm:flex items-center space-x-1.5 text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
            title="Create New Indent"
            aria-label="Create New Indent"
          >
            <PlusCircle className="w-4 h-4" />
          </Link>

          {/* Quick Security Shield Link */}
          <div className="relative">
            <button
              onClick={() => navigate('/security')}
              className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
              title="Security Shield Logs"
              aria-label="Security Shield Logs"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Mode Selector */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full animate-pulse" />
              )}
            </button>
          </div>

          {/* Clock Display */}
          {currentTime && (
            <span className="hidden xl:inline-block text-[11px] font-medium text-text-muted font-mono leading-none">
              {currentTime}
            </span>
          )}

          {/* Profile Avatar & Card Box Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-accent-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 group cursor-pointer"
              aria-label="Open user menu"
              aria-expanded={isProfileOpen}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-[#5030E5] flex items-center justify-center text-white text-xs font-black shadow-glow ring-2 ring-accent-primary/30 transition-transform group-hover:scale-105">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            </button>

            {isProfileOpen && (
              <>
                {/* Backdrop to close on outside click */}
                <div
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                  onClick={() => setIsProfileOpen(false)}
                />

                {/* Profile Card Box */}
                <div className="absolute right-0 top-full mt-3 w-64 bg-surface-card border border-border-default rounded-2xl shadow-2xl overflow-hidden z-50 font-sans backdrop-blur-xl animate-fade-in divide-y divide-border-default/60">
                  {/* Top Profile Info Box */}
                  <div className="p-4 bg-gradient-to-b from-surface-elevated/90 to-surface-card/60 flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent-primary to-[#5030E5] flex items-center justify-center text-white text-sm font-black shadow-glow ring-2 ring-accent-primary/30">
                        {user?.firstName?.charAt(0) || 'U'}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-status-success rounded-full border-2 border-surface-card shadow-xs" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-text-primary truncate leading-snug">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-accent-primary/15 text-accent-primary border border-accent-primary/25 uppercase tracking-wider inline-block mt-1 truncate max-w-full">
                        {user?.role?.roleName || 'System User'}
                      </span>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="p-2 space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all duration-150 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-surface-card border border-border-default/60 flex items-center justify-center text-text-muted group-hover:text-accent-primary group-hover:border-accent-primary/40 transition-colors">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold">My Profile</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>

                    <Link
                      to="/security"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all duration-150 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-surface-card border border-border-default/60 flex items-center justify-center text-text-muted group-hover:text-accent-primary group-hover:border-accent-primary/40 transition-colors">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold">Security Settings</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>

                  {/* Sign Out Action Button */}
                  <div className="p-2.5 bg-surface-elevated/30">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-status-error bg-status-error/10 hover:bg-status-error hover:text-white border border-status-error/25 transition-all duration-200 shadow-xs focus:outline-none cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Notification Drawer Overlay */}
      <Suspense fallback={null}>
        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
      </Suspense>

      {/* Command Palette search console */}
      <Suspense fallback={null}>
        <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </Suspense>
    </>
  );
};
