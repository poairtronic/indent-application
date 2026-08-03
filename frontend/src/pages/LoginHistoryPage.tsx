import React, { useEffect } from 'react';
import { useSecurityStore } from '../store/securityStore';

export const LoginHistoryPage: React.FC = () => {
  const { loginHistory, fetchLoginHistory, isLoading } = useSecurityStore();

  useEffect(() => {
    fetchLoginHistory();
  }, [fetchLoginHistory]);

  const getStatusBadge = (entry: any) => {
    if (entry.activity === 'LOGIN_SUCCESS') {
      return (
        <span className="px-2 py-0.5 text-xs bg-status-success/12 text-status-success rounded-full">
          Success
        </span>
      );
    }
    if (entry.activity === 'LOGIN_FAILED') {
      return (
        <span className="px-2 py-0.5 text-xs bg-status-error/12 text-status-error rounded-full">
          Failed
        </span>
      );
    }
    if (entry.activity === 'LOGOUT') {
      return (
        <span className="px-2 py-0.5 text-xs bg-background-secondary text-text-secondary rounded-full">
          Logout
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs bg-background-secondary text-text-secondary rounded-full">
        {entry.activity}
      </span>
    );
  };

  if (isLoading && loginHistory.length === 0) {
    return <div className="text-text-muted text-center p-8">Loading login history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Login History</h1>
        <p className="text-text-muted mt-1">Recent login activity for your account</p>
      </div>

      <div className="bg-surface-card border border-border-default rounded-xl shadow-sm overflow-hidden">
        {loginHistory.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No login history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background-secondary">
                  <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wide">
                    Date & Time
                  </th>
                  <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wide">
                    IP Address
                  </th>
                  <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wide">
                    Browser
                  </th>
                  <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wide">
                    OS
                  </th>
                  <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wide">
                    Device
                  </th>
                  <th className="text-left px-4 py-3 text-text-muted font-semibold text-xs uppercase tracking-wide">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loginHistory.map((entry) => (
                  <tr key={entry.id} className="hover:bg-background-secondary/70 transition-colors">
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(entry)}</td>
                    <td className="px-4 py-3 text-text-muted font-mono text-xs">
                      {entry.ipAddress || '-'}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{entry.browser || '-'}</td>
                    <td className="px-4 py-3 text-text-muted">{entry.operatingSystem || '-'}</td>
                    <td className="px-4 py-3 text-text-muted">{entry.device || '-'}</td>
                    <td className="px-4 py-3 text-text-muted max-w-[200px] truncate">
                      {entry.failureReason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
