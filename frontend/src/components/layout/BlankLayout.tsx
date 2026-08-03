import React from 'react';
import { Outlet } from 'react-router-dom';

export const BlankLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary transition-colors duration-300">
      <Outlet />
    </div>
  );
};
