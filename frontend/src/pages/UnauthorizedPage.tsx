import React from 'react';
import { useNavigate } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary text-text-primary">
      <div className="text-center space-y-6">
        <div className="text-8xl font-bold text-status-error">403</div>
        <h1 className="text-3xl font-semibold">Access Denied</h1>
        <p className="text-text-muted max-w-md">
          You do not have the required permissions to access this page. Please contact your system
          administrator if you believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-surface-elevated hover:bg-surface-hover rounded-lg transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-accent-primary hover:bg-accent-hover rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
