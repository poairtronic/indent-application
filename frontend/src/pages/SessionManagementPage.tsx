import React, { useEffect, useState } from 'react';
import { useSecurityStore, Session } from '../store/securityStore';

export const SessionManagementPage: React.FC = () => {
  const { sessions, fetchSessions, revokeSession, logoutOtherSessions, logoutAllSessions, isLoading } = useSecurityStore();
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const getDeviceIcon = (device: string | null) => {
    switch ((device ?? '').toLowerCase()) {
      case 'mobile': return '📱';
      case 'tablet': return '📟';
      default: return '💻';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Session Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your active sessions across devices
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={logoutOtherSessions}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-50 transition-colors"
        >
          Logout Other Sessions
        </button>
        {!confirmLogoutAll ? (
          <button
            onClick={() => setConfirmLogoutAll(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
          >
            Logout All Sessions
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-red-500 text-sm">Are you sure?</span>
            <button
              onClick={async () => {
                await logoutAllSessions();
                setConfirmLogoutAll(false);
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmLogoutAll(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {isLoading && sessions.length === 0 && (
        <div className="text-gray-500 text-center py-8">Loading sessions...</div>
      )}

      {!isLoading && sessions.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow-sm">
          <p className="text-gray-500">No active sessions found.</p>
        </div>
      )}

      <div className="grid gap-4">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onRevoke={revokeSession}
          />
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border-l-4 ${
      isActive ? 'border-l-green-500' : 'border-l-gray-400'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="text-3xl mt-1">{getDeviceIcon(session.device)}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {session.browser || 'Unknown Browser'}
              </h3>
              {isActive && (
                <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                  Active
                </span>
              )}
              {!isActive && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">
                  {session.status}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1 space-y-0.5">
              <p>Device: {session.device || 'Unknown'} &middot; OS: {session.operatingSystem || 'Unknown'}</p>
              <p>IP: {session.ipAddress || 'Unknown'}</p>
              <p>Logged in: {new Date(session.loginAt).toLocaleString()}</p>
              {session.lastActivity && (
                <p>Last activity: {new Date(session.lastActivity).toLocaleString()}</p>
              )}
              {session.expiresAt && (
                <p>Expires: {new Date(session.expiresAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
        {isActive && (
          <button
            onClick={handleRevoke}
            disabled={isRevoking}
            className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
          >
            {isRevoking ? 'Revoking...' : 'Revoke'}
          </button>
        )}
      </div>
    </div>
  );
};

function getDeviceIcon(device: string | null): string {
  switch ((device ?? '').toLowerCase()) {
    case 'mobile': return '📱';
    case 'tablet': return '📟';
    default: return '💻';
  }
}
