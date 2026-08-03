import React from 'react';
import { Outlet } from 'react-router-dom';

export const FullscreenLayout: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-background-primary text-text-primary p-4 font-sans transition-colors duration-300">
      <Outlet />
    </div>
  );
};
