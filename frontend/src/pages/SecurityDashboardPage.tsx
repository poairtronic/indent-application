import React, { useEffect } from 'react';
import { useSecurityStore } from '../store/securityStore';

export const SecurityDashboardPage: React.FC = () => {
  const { securityStatus, fetchSecurityStatus, isLoading } = useSecurityStore();

  useEffect(() => {
    fetchSecurityStatus();
  }, [fetchSecurityStatus]);

  if (isLoading && !securityStatus) {
    return <div className="text-white text-center p-8">Loading security status...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Account security status and activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white">Account Status</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span
                className={`font-medium ${
                  securityStatus?.accountStatus === 'ACTIVE' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {securityStatus?.accountStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Locked</span>
              <span
                className={`font-medium ${securityStatus?.isLocked ? 'text-red-500' : 'text-green-500'}`}
              >
                {securityStatus?.isLocked ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Login</span>
              <span className="text-gray-700 dark:text-gray-300">
                {securityStatus?.lastLogin
                  ? new Date(securityStatus.lastLogin).toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white">Password Status</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Age</span>
              <span
                className={`font-medium ${
                  securityStatus?.passwordAgeDays !== null &&
                  securityStatus?.passwordAgeDays !== undefined &&
                  securityStatus.passwordAgeDays > 90
                    ? 'text-red-500'
                    : 'text-green-500'
                }`}
              >
                {securityStatus?.passwordAgeDays !== null &&
                securityStatus?.passwordAgeDays !== undefined
                  ? `${securityStatus.passwordAgeDays} days`
                  : 'Not tracked'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Created</span>
              <span className="text-gray-700 dark:text-gray-300">
                {securityStatus?.accountCreatedAt
                  ? new Date(securityStatus.accountCreatedAt).toLocaleDateString()
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white">Failed Attempts</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Failed Logins</span>
              <span
                className={`font-medium font-bold text-lg ${
                  (securityStatus?.failedLoginAttempts ?? 0) > 0 ? 'text-red-500' : 'text-green-500'
                }`}
              >
                {securityStatus?.failedLoginAttempts ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Remaining Attempts</span>
              <span className="font-medium">{securityStatus?.remainingAttempts ?? 5}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Max Attempts</span>
              <span className="font-medium">{securityStatus?.maxFailedAttempts ?? 5}</span>
            </div>
          </div>
        </div>
      </div>

      {securityStatus?.isLocked && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="font-semibold text-red-800 dark:text-red-400">Account Locked</h3>
          <p className="text-red-600 dark:text-red-300 mt-2">
            Your account is locked until{' '}
            {securityStatus.lockedUntil
              ? new Date(securityStatus.lockedUntil).toLocaleString()
              : 'unknown'}
            .
          </p>
          <p className="text-red-600 dark:text-red-300 mt-1">
            Please wait for the lock to expire or contact an administrator.
          </p>
        </div>
      )}
    </div>
  );
};
