import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const AccountLockPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-6 text-center font-sans transition-colors duration-300">
      <div className="max-w-md w-full bg-surface-card border border-border-default rounded-2xl p-8 shadow-modal">
        <h1 className="text-6xl font-extrabold text-status-warning mb-2">🔒</h1>
        <h2 className="text-xl font-bold text-text-primary mb-4">Account Locked</h2>
        <p className="text-sm text-text-secondary mb-8">
          Your account has been temporarily locked due to multiple failed login attempts. This is a
          security measure to protect your account.
        </p>
        <div className="bg-background-secondary rounded-lg p-4 text-left space-y-2 mb-8">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">What to do:</strong>
          </p>
          <ul className="text-sm text-text-secondary list-disc list-inside space-y-1">
            <li>Wait for the lock timeout period to expire (typically 30 minutes)</li>
            <li>Contact your system administrator for immediate unlock</li>
            <li>Reset your password using the "Forgot Password" option</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => navigate('/login')} className="w-full">
            Back to Login
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/forgot-password')}
            className="w-full"
          >
            Forgot Password
          </Button>
        </div>
      </div>
    </div>
  );
};
