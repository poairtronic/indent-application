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
        <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
          Success
        </span>
      );
    }
    if (entry.activity === 'LOGIN_FAILED') {
      return (
        <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full">
          Failed
        </span>
      );
    }
    if (entry.activity === 'LOGOUT') {
      return (
        <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">
          Logout
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">
        {entry.activity}
      </span>
    );
  };

  if (isLoading && loginHistory.length === 0) {
    return <div className="text-white text-center p-8">Loading login history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Login History</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Recent login activity for your account
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {loginHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No login history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">
                    Date & Time
                  </th>
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">
                    IP Address
                  </th>
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">
                    Browser
                  </th>
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">
                    OS
                  </th>
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">
                    Device
                  </th>
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loginHistory.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(entry)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {entry.ipAddress || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {entry.browser || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {entry.operatingSystem || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {entry.device || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
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
