import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { usePrefetch } from '../../hooks/usePrefetch';

export const DashboardLayout: React.FC = () => {
  const { prefetchPath } = usePrefetch();

  useEffect(() => {
    // Eagerly prefetch master data needed for core flows (like Indent creation)
    // to improve user-perceived performance and prevent waterfalls on navigation
    prefetchPath('/indents');
  }, [prefetchPath]);

  return (
    <div className="flex h-screen bg-background-primary text-text-primary font-sans transition-colors duration-300 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-background-secondary relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-accent-primary/12 blur-[120px]" />
            <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full bg-info/10 blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-7xl">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
