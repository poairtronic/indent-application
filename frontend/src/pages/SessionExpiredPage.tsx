import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Clock, LogIn } from 'lucide-react';

export const SessionExpiredPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const handleSignIn = () => {
    if (returnUrl) {
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-6 text-center font-sans transition-colors duration-300">
      <div className="max-w-md w-full bg-surface-card border border-border-default rounded-2xl p-8 shadow-modal">
        <div className="w-16 h-16 bg-status-warning/10 text-status-warning rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Session Expired</h2>
        <p className="text-xs text-text-secondary mb-6">
          Your active session has timed out due to inactivity or token expiration. For security
          purposes, please sign in again to resume your work.
        </p>

        <Button variant="primary" icon={<LogIn size={16} />} onClick={handleSignIn} fullWidth>
          Sign In Again
        </Button>
      </div>
    </div>
  );
};
