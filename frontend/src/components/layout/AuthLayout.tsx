import React from 'react';
import { Outlet, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const AuthLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [searchParams] = useSearchParams();

  if (isAuthenticated) {
    const returnUrl = searchParams.get('returnUrl');
    const targetPath = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
    return <Navigate to={targetPath} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary px-4 py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 bg-surface-card border border-border-default rounded-2xl p-8 shadow-modal">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
            IMCMS Enterprise
          </h2>
          <p className="mt-2 text-sm text-text-secondary">Indent & Costing Management System</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
