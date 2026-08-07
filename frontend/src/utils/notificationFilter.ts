import type { AuthUser } from '../api/services/auth/types';

export function filterNotificationsForUser(items: any[], user: AuthUser | null): any[] {
  if (!user) return [];

  const roleName = user.role?.roleName;
  const isAdmin = roleName === 'ADMIN' || roleName === 'System Administrator';
  if (isAdmin) return items;

  const userDept = user.department?.departmentCode?.toUpperCase() ?? '';

  return items.filter((item) => {
    const title = (item.title || '').toLowerCase();

    if (userDept === 'DSGN' || userDept === 'DESIGN') {
      // Design: Draft Returned, Cost Sheet Updated (represented as actual cost updated)
      return (
        (title.includes('draft') && title.includes('returned')) ||
        title.includes('cost sheet updated') ||
        title.includes('actual cost')
      );
    }

    if (userDept === 'STOR' || userDept === 'STORES') {
      // Stores: New Indent Submitted
      return title.includes('new manufacturing indent') || title.includes('indent submitted');
    }

    if (userDept === 'PROD' || userDept === 'PRODUCTION') {
      // Production: Materials Issued
      return title.includes('material issued') || title.includes('materials issued');
    }

    if (userDept === 'ACCT' || userDept === 'ACCOUNTS') {
      // Accounts: Production Completed
      return (
        title.includes('production completed') ||
        title.includes('production manufacturing completed') ||
        title.includes('manufacturing completed')
      );
    }

    if (
      userDept === 'SMGR' ||
      userDept === 'GMGR' ||
      roleName === 'Senior Manager' ||
      roleName === 'General Manager'
    ) {
      // Senior/General Manager: Actual Cost Updated, Financial Closure, Archive Completed
      return (
        title.includes('actual cost') ||
        title.includes('financial closure') ||
        title.includes('archived') ||
        title.includes('completed')
      );
    }

    return false;
  });
}
