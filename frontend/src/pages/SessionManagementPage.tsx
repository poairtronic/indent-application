import React, { useEffect, useState } from 'react';
import { Smartphone, Tablet, Laptop, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useSecurityStore, type Session } from '../store/securityStore';
import { Button } from '../components/ui/Button';

export const SessionManagementPage: React.FC = () => {
  const {
    sessions,
    fetchSessions,
    revokeSession,
    logoutOtherSessions,
    logoutAllSessions,
    isLoading,
  } = useSecurityStore();
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="space-y-6">
      <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-card">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Session Management</h1>
        <p className="text-text-muted mt-1">Manage your active sessions across devices</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="warning" onClick={logoutOtherSessions} disabled={isLoading}>
          Logout Other Sessions
        </Button>
        {!confirmLogoutAll ? (
          <Button variant="danger" onClick={() => setConfirmLogoutAll(true)}>
            Logout All Sessions
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-status-error text-sm font-medium">Are you sure?</span>
            <Button
              variant="danger"
              onClick={async () => {
                await logoutAllSessions();
                setConfirmLogoutAll(false);
              }}
              disabled={isLoading}
            >
              Confirm
            </Button>
            <Button variant="secondary" onClick={() => setConfirmLogoutAll(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {isLoading && sessions.length === 0 && (
        <div className="text-text-muted text-center py-8">Loading sessions...</div>
      )}

      {!isLoading && sessions.length === 0 && (
        <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center shadow-card">
          <p className="text-text-muted">No active sessions found.</p>
        </div>
      )}

      <div className="grid gap-4">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} onRevoke={revokeSession} />
        ))}
      </div>
    </div>
  );
};

const SessionCard: React.FC<{
  session: Session;
  onRevoke: (id: string) => void;
}> = ({ session, onRevoke }) => {
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);
    await onRevoke(session.id);
    setIsRevoking(false);
  };

  const isActive = session.status === 'ACTIVE' && !session.logoutAt;

  return (
    <div
      className={`bg-surface-card border border-border-default rounded-xl p-5 shadow-card border-l-4 transition-colors ${
        isActive ? 'border-l-status-success' : 'border-l-border-strong'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-background-secondary border border-border-default flex items-center justify-center text-accent-primary shrink-0">
            {getDeviceIcon(session.device)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-text-primary">
                {session.browser || 'Unknown Browser'}
              </h3>
              {isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-status-success/12 text-status-success rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Active
                </span>
              )}
              {!isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-background-secondary text-text-secondary rounded-full">
                  <ShieldAlert className="w-3 h-3" />
                  {session.status}
                </span>
              )}
            </div>
            <div className="text-xs text-text-muted mt-1.5 space-y-0.5">
              <p>
                Device: {session.device || 'Unknown'} &middot; OS:{' '}
                {session.operatingSystem || 'Unknown'}
              </p>
              <p>IP: {session.ipAddress || 'Unknown'}</p>
              <p>Logged in: {new Date(session.loginAt).toLocaleString()}</p>
              {session.lastActivity && (
                <p>Last activity: {new Date(session.lastActivity).toLocaleString()}</p>
              )}
              {session.expiresAt && <p>Expires: {new Date(session.expiresAt).toLocaleString()}</p>}
            </div>
          </div>
        </div>
        {isActive && (
          <Button variant="danger" size="sm" onClick={handleRevoke} disabled={isRevoking}>
            {isRevoking ? 'Revoking...' : 'Revoke'}
          </Button>
        )}
      </div>
    </div>
  );
};

function getDeviceIcon(device: string | null): React.ReactNode {
  switch ((device ?? '').toLowerCase()) {
    case 'mobile':
      return <Smartphone className="w-5 h-5" />;
    case 'tablet':
      return <Tablet className="w-5 h-5" />;
    default:
      return <Laptop className="w-5 h-5" />;
  }
}
