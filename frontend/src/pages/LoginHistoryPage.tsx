import React, { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSecurityStore } from '../store/securityStore';
import { Badge } from '../components/ui/Badge';
import { BaseCard } from '../components/ui/Cards';

export const LoginHistoryPage: React.FC = () => {
  const { loginHistory, fetchLoginHistory, isLoading } = useSecurityStore(
    useShallow((state) => ({
      loginHistory: state.loginHistory,
      fetchLoginHistory: state.fetchLoginHistory,
      isLoading: state.isLoading,
    })),
  );

  useEffect(() => {
    fetchLoginHistory();
  }, [fetchLoginHistory]);

  const getStatusBadge = (entry: any) => {
    if (entry.activity === 'LOGIN_SUCCESS') {
      return (
        <Badge tone="green" size="sm">
          Success
        </Badge>
      );
    }
    if (entry.activity === 'LOGIN_FAILED') {
      return (
        <Badge tone="red" size="sm">
          Failed
        </Badge>
      );
    }
    if (entry.activity === 'LOGOUT') {
      return (
        <Badge tone="gray" size="sm">
          Logout
        </Badge>
      );
    }
    return (
      <Badge tone="gray" size="sm">
        {entry.activity}
      </Badge>
    );
  };

  if (isLoading && loginHistory.length === 0) {
    return <div className="text-text-muted text-center p-8">Loading login history...</div>;
  }

  return (
    <div className="space-y-6">
      <BaseCard className="p-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Login History</h1>
        <p className="text-text-muted mt-1">Recent login activity for your account</p>
      </BaseCard>

      <BaseCard className="overflow-hidden">
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
      </BaseCard>
    </div>
  );
};
