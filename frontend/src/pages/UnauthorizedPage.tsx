import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-6 text-center font-sans transition-colors duration-300">
      <div className="max-w-md w-full bg-surface-card border border-border-default rounded-2xl p-8 shadow-modal">
        <h1 className="text-6xl font-extrabold text-status-error mb-2">403</h1>
        <h2 className="text-xl font-bold text-text-primary mb-4">Access Denied</h2>
        <p className="text-sm text-text-secondary mb-8">
          You do not have the required permissions to access this page. Please contact your system
          administrator if you believe this is an error.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)} className="w-full">
            Go Back
          </Button>
          <Button variant="primary" onClick={() => navigate('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
