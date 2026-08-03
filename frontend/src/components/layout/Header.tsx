import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/theme.store';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const pathnames = location.pathname.split('/').filter((x) => x);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-border-default bg-surface-card px-6 flex items-center justify-between font-sans transition-colors duration-300">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm">
        <Link to="/dashboard" className="text-text-muted hover:text-text-primary transition-colors">
          Home
        </Link>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayLabel = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');

          return (
            <React.Fragment key={routeTo}>
              <span className="text-text-muted">/</span>
              {isLast ? (
                <span className="text-text-primary font-semibold">{displayLabel}</span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  {displayLabel}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Center: Search & Favorites Placeholders */}
      <div className="hidden lg:flex items-center gap-4 max-w-md w-full mx-8">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Global Search... (Ctrl + K)"
            disabled
            className="w-full bg-background-primary border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-muted outline-none cursor-not-allowed flex items-center justify-between"
          />
          <span className="absolute right-3 top-2 text-[10px] bg-surface-elevated text-text-muted px-1.5 py-0.5 rounded border border-border-default">
            Ctrl + K
          </span>
        </div>
      </div>

      {/* Right: Actions (Theme, Notifications, Profile Dropdown) */}
      <div className="flex items-center space-x-4">
        {/* Theme Switcher Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-text-secondary hover:text-text-primary text-lg p-1.5 rounded-lg hover:bg-background-secondary transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Notifications Area Placeholder */}
        <div className="relative">
          <button className="text-text-secondary hover:text-text-primary text-lg p-1.5 rounded-lg hover:bg-background-secondary transition-colors">
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full" />
          </button>
        </div>

        {/* Profile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-background-secondary transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center text-white text-sm font-bold border border-border-default">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-text-primary">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-text-muted uppercase">{user?.role?.roleName}</p>
            </div>
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-surface-card border border-border-default rounded-xl shadow-dropdown py-1 z-20 font-sans">
                <Link
                  to="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-2 text-sm text-text-secondary hover:bg-background-secondary hover:text-text-primary transition-colors"
                >
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-2 text-sm text-text-secondary hover:bg-background-secondary hover:text-text-primary transition-colors"
                >
                  Settings
                </Link>
                <div className="border-t border-border-default my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-status-error hover:bg-background-secondary transition-colors"
                >
                  Logout Session
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
