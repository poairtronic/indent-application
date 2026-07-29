export enum AppRole {
  ADMIN = 'ADMIN',
  REQUESTER = 'REQUESTER',
  APPROVER = 'APPROVER',
  PURCHASE_OFFICER = 'PURCHASE_OFFICER',
}

export const ROLE_LABELS: Record<AppRole, string> = {
  [AppRole.ADMIN]: 'System Administrator',
  [AppRole.REQUESTER]: 'Indent Requester',
  [AppRole.APPROVER]: 'Indent Approver',
  [AppRole.PURCHASE_OFFICER]: 'Purchase Officer',
};
