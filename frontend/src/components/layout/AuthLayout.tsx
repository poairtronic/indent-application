import React from 'react';
import { Outlet, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/theme.store';
import { Sun, Moon } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [searchParams] = useSearchParams();
  const { resolvedTheme, toggleTheme } = useThemeStore();

  if (isAuthenticated) {
    const returnUrl = searchParams.get('returnUrl');
    const targetPath = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
    return <Navigate to={targetPath} replace />;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#F8FAFD] dark:bg-[#07090B] relative flex flex-col justify-between p-6 sm:p-10 lg:p-12 font-sans text-[#0B132B] dark:text-white overflow-x-hidden transition-colors duration-300 selection:bg-[#6D4AFF]/20 selection:text-[#6D4AFF]">
      {/* 1. Full-Screen Realistic Industrial Factory Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <img
          src="/images/dark-factory-bg.jpg"
          alt="Modern Automated Manufacturing Plant"
          className="w-full h-full object-cover object-center transition-opacity duration-500 opacity-60 dark:opacity-100"
        />
        {/* Layered Atmospheric Light / Dark Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-[#F8FAFD]/80 to-[#F8FAFD]/65 dark:from-black/80 dark:via-[#07090B]/60 dark:to-[#07090B]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(109,74,255,0.12),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(109,74,255,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFD] via-transparent to-[#F8FAFD]/40 dark:from-[#07090B] dark:via-transparent dark:to-[#07090B]/40" />
      </div>

      {/* 2. Top-Left MERC Branding & Top-Right Theme Switcher */}
      <header className="relative z-10 flex items-center justify-between select-none">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-tr from-[#6D4AFF] to-[#8B5CF6] flex items-center justify-center text-white shadow-[0_4px_20px_rgba(109,74,255,0.4)] border border-white/30">
            <svg
              width="24"
              height="24"
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
          <div>
            <span className="text-2xl font-black tracking-wider text-[#0B132B] dark:text-white uppercase leading-none block">
              MERC
            </span>
            <span className="text-[11px] text-[#64748B] dark:text-gray-300 font-medium tracking-wide mt-1 block">
              Manufacturing Enterprise Resource &amp; Costing
            </span>
          </div>
        </div>

        {/* Theme switcher toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle light/dark theme"
          className="w-10 h-10 rounded-xl bg-white/80 dark:bg-surface-elevated/80 border border-border-default flex items-center justify-center text-text-muted hover:text-[#6D4AFF] dark:hover:text-[#8B5CF6] transition-all shadow-sm hover:scale-105"
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* 3. Main Split Viewport Section */}
      <main className="relative z-10 w-full max-w-7xl mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Side: Real DOM Marketing Content (Directly over factory background) */}
        <section className="lg:col-span-7 space-y-5 select-none">
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-[#0B132B] dark:text-white leading-[1.12] tracking-tight">
            Optimizing yield,
            <br />
            tracking <span className="text-[#6D4AFF] dark:text-[#8B5CF6]">real-time cost.</span>
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-gray-300 font-normal leading-relaxed max-w-lg">
            Unify supply workflows, machine telemetry, automated indents, and operational costs into
            a single control plane built for modern heavy industry.
          </p>
        </section>

        {/* Right Side: Clean Enterprise Login Surface */}
        <section className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[480px] p-8 sm:p-10 rounded-[28px] bg-white dark:bg-[rgba(12,16,23,0.75)] dark:backdrop-blur-[24px] border border-[#E2E8F0] dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(109,74,255,0.08),0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.65)] transition-all">
            <Outlet />
          </div>
        </section>
      </main>

      {/* 4. Footer */}
      <footer className="relative z-10 select-none text-[11px] text-[#94A3B8] dark:text-gray-400/80">
        <span>&copy; {new Date().getFullYear()} MERC Enterprise Systems. All rights reserved.</span>
      </footer>
    </div>
  );
};

export default AuthLayout;
