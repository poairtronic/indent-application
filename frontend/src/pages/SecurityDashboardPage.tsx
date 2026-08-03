import React, { useEffect } from 'react';
import { useSecurityStore } from '../store/securityStore';

export const SecurityDashboardPage: React.FC = () => {
  const { securityStatus, fetchSecurityStatus, isLoading } = useSecurityStore();

  useEffect(() => {
    fetchSecurityStatus();
  }, [fetchSecurityStatus]);

  if (isLoading && !securityStatus) {
    return <div className="text-text-muted text-center p-8">Loading security status...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Security Overview</h1>
        <p className="text-text-muted mt-1">Account security status and activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-text-primary">Account Status</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Status</span>
              <span
                className={`font-medium ${
                  securityStatus?.accountStatus === 'ACTIVE'
                    ? 'text-status-success'
                    : 'text-status-error'
                }`}
              >
                {securityStatus?.accountStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Locked</span>
              <span
                className={`font-medium ${
                  securityStatus?.isLocked ? 'text-status-error' : 'text-status-success'
                }`}
              >
                {securityStatus?.isLocked ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Last Login</span>
              <span className="text-text-secondary">
                {securityStatus?.lastLogin
                  ? new Date(securityStatus.lastLogin).toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-text-primary">Password Status</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Age</span>
              <span
                className={`font-medium ${
                  securityStatus?.passwordAgeDays !== null &&
                  securityStatus?.passwordAgeDays !== undefined &&
                  securityStatus.passwordAgeDays > 90
                    ? 'text-status-error'
                    : 'text-status-success'
                }`}
              >
                {securityStatus?.passwordAgeDays !== null &&
                securityStatus?.passwordAgeDays !== undefined
                  ? `${securityStatus.passwordAgeDays} days`
                  : 'Not tracked'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Account Created</span>
              <span className="text-text-secondary">
                {securityStatus?.accountCreatedAt
                  ? new Date(securityStatus.accountCreatedAt).toLocaleDateString()
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-text-primary">Failed Attempts</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Failed Logins</span>
              <span
                className={`font-bold text-lg ${
                  (securityStatus?.failedLoginAttempts ?? 0) > 0
                    ? 'text-status-error'
                    : 'text-status-success'
                }`}
              >
                {securityStatus?.failedLoginAttempts ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Remaining Attempts</span>
              <span className="font-medium text-text-primary">
                {securityStatus?.remainingAttempts ?? 5}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Max Attempts</span>
              <span className="font-medium text-text-primary">
                {securityStatus?.maxFailedAttempts ?? 5}
              </span>
            </div>
          </div>
        </div>
      </div>

      {securityStatus?.isLocked && (
        <div className="bg-status-error/10 border border-status-error/25 rounded-xl p-6">
          <h3 className="font-semibold text-status-error">Account Locked</h3>
          <p className="text-status-error/90 mt-2">
            Your account is locked until{' '}
            {securityStatus.lockedUntil
              ? new Date(securityStatus.lockedUntil).toLocaleString()
              : 'unknown'}
            .
          </p>
          <p className="text-status-error/90 mt-1">
            Please wait for the lock to expire or contact an administrator.
          </p>
        </div>
      )}
    </div>
  );
};
