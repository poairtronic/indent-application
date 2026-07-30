import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useSidebar } from '../../store/sidebar.store';

export const DashboardLayout: React.FC = () => {
  const { isOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <main
        className={`flex-1 overflow-auto transition-all duration-300 ${
          isOpen ? 'md:ml-64' : 'md:ml-16'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
