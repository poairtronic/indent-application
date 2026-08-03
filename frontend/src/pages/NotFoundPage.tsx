import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-6 text-center font-sans transition-colors duration-300">
      <div className="max-w-md w-full bg-surface-card border border-border-default rounded-2xl p-8 shadow-modal">
        <h1 className="text-7xl font-extrabold text-accent-primary mb-2">404</h1>
        <h2 className="text-xl font-bold text-text-primary mb-4">Page Not Found</h2>
        <p className="text-sm text-text-secondary mb-8">
          The page you are looking for might have been removed, had its name changed, or is
          temporarily unavailable.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-2.5 px-4 bg-accent-primary hover:bg-accent-hover active:bg-accent-pressed text-white font-semibold rounded-lg text-sm transition-all duration-150"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
