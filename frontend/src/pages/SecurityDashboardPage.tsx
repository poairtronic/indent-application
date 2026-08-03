import React, { useEffect } from 'react';
import { useSecurityStore } from '../store/securityStore';
import { Badge } from '../components/ui/Badge';
import { BaseCard } from '../components/ui/Cards';

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
      <BaseCard className="p-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Security Overview</h1>
        <p className="text-text-muted mt-1">Account security status and activity</p>
      </BaseCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <BaseCard className="p-6">
          <h3 className="font-semibold text-text-primary">Account Status</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Status</span>
              <Badge tone={securityStatus?.accountStatus === 'ACTIVE' ? 'green' : 'red'} size="sm">
                {securityStatus?.accountStatus}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Locked</span>
              <Badge tone={securityStatus?.isLocked ? 'red' : 'green'} size="sm">
                {securityStatus?.isLocked ? 'Yes' : 'No'}
              </Badge>
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
        </BaseCard>

        <BaseCard className="p-6">
          <h3 className="font-semibold text-text-primary">Password Status</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Age</span>
              <Badge
                tone={
                  securityStatus?.passwordAgeDays !== null &&
                  securityStatus?.passwordAgeDays !== undefined &&
                  securityStatus.passwordAgeDays > 90
                    ? 'red'
                    : 'green'
                }
                size="sm"
              >
                {securityStatus?.passwordAgeDays !== null &&
                securityStatus?.passwordAgeDays !== undefined
                  ? `${securityStatus.passwordAgeDays} days`
                  : 'Not tracked'}
              </Badge>
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
        </BaseCard>

        <BaseCard className="p-6">
          <h3 className="font-semibold text-text-primary">Failed Attempts</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Failed Logins</span>
              <Badge
                tone={(securityStatus?.failedLoginAttempts ?? 0) > 0 ? 'red' : 'green'}
                size="sm"
              >
                {securityStatus?.failedLoginAttempts ?? 0}
              </Badge>
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
        </BaseCard>
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
