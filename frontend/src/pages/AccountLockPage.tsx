import React from 'react';
import { useNavigate } from 'react-router-dom';

export const AccountLockPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary text-text-primary">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">🔒</div>
        <h1 className="text-3xl font-semibold">Account Locked</h1>
        <p className="text-text-muted">
          Your account has been temporarily locked due to multiple failed login attempts. This is a
          security measure to protect your account.
        </p>
        <div className="bg-surface-card rounded-lg p-4 text-left space-y-2">
          <p className="text-sm text-text-muted">
            <strong className="text-text-primary">What to do:</strong>
          </p>
          <ul className="text-sm text-text-muted list-disc list-inside space-y-1">
            <li>Wait for the lock timeout period to expire (typically 30 minutes)</li>
            <li>Contact your system administrator for immediate unlock</li>
            <li>Reset your password using the "Forgot Password" option</li>
          </ul>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-accent-primary hover:bg-accent-hover rounded-lg transition-colors"
          >
            Back to Login
          </button>
          <button
            onClick={() => navigate('/forgot-password')}
            className="px-6 py-2 bg-surface-elevated hover:bg-surface-hover rounded-lg transition-colors"
          >
            Forgot Password
          </button>
        </div>
      </div>
    </div>
  );
};
