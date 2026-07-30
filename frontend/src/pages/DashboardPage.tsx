import React from 'react';
import { useAuthStore } from '../store/authStore';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {user?.role?.roleName} &middot; {user?.department?.departmentName}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white">My Permissions</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{permissions.length}</p>
          <p className="text-sm text-gray-500 mt-1">Assigned permission codes</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white">Department</h3>
          <p className="text-lg font-medium text-gray-900 dark:text-white mt-2">
            {user?.department?.departmentName}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white">Employee Code</h3>
          <p className="text-lg font-medium text-gray-900 dark:text-white mt-2">
            {user?.employeeCode}
          </p>
        </div>
      </div>
    </div>
  );
};
