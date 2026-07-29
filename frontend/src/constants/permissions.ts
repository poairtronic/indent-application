export enum AppPermission {
  CREATE_INDENT = 'CREATE_INDENT',
  VIEW_INDENT = 'VIEW_INDENT',
  APPROVE_INDENT = 'APPROVE_INDENT',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_REPORTS = 'VIEW_REPORTS',
  MANAGE_VENDORS = 'MANAGE_VENDORS',
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
}

export const ROLE_PERMISSIONS: Record<string, AppPermission[]> = {
  ADMIN: Object.values(AppPermission),
  REQUESTER: [AppPermission.CREATE_INDENT, AppPermission.VIEW_INDENT],
  APPROVER: [AppPermission.VIEW_INDENT, AppPermission.APPROVE_INDENT],
  PURCHASE_OFFICER: [
    AppPermission.VIEW_INDENT,
    AppPermission.MANAGE_VENDORS,
    AppPermission.MANAGE_INVENTORY,
  ],
};
