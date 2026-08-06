import type { AuthUser } from '../api/services/auth/types';

export function filterNotificationsForUser(items: any[], user: AuthUser | null): any[] {
  if (!user) return [];

  const isAdmin = user.permissions.includes('settings.manage');
  if (isAdmin) return items;

  const userDept = user.department?.departmentCode?.toUpperCase() ?? '';

  return items.filter((item) => {
    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();
    const text = `${title} ${msg}`;

    if (userDept === 'DSGN') {
      // Design: Own transactions (Draft, Design Created, Submitted)
      return text.includes('draft') || text.includes('design') || text.includes('created') || text.includes('submitted');
    }

    if (userDept === 'STOR') {
      // Stores: Indent Submitted, Stock verification, Material issue/dispatch
      return text.includes('submitted') || text.includes('stores') || text.includes('stock') || text.includes('issue') || text.includes('dispatch');
    }

    if (userDept === 'PROD') {
      // Production: Material Issued, Start/Complete Manufacturing, Deliver
      return text.includes('issued') || text.includes('production') || text.includes('manufacturing') || text.includes('completed') || text.includes('delivered');
    }

    if (userDept === 'ACCT') {
      // Accounts: Completed, Delivered, Cost Verification, Actual Costs, Financial Closure
      return text.includes('completed') || text.includes('delivered') || text.includes('cost') || text.includes('finance') || text.includes('closure') || text.includes('accounts');
    }

    if (userDept === 'SMGR' || userDept === 'GMGR') {
      // Management: Actual Costs, Financial Closure, Archived, Completed
      return text.includes('actual cost') || text.includes('updated') || text.includes('closure') || text.includes('closed') || text.includes('archived') || text.includes('completed');
    }

    return false;
  });
}
