export enum IndentStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}

export const INDENT_STATUS_LABELS: Record<IndentStatus, string> = {
  [IndentStatus.DRAFT]: 'Draft',
  [IndentStatus.PENDING_APPROVAL]: 'Pending Approval',
  [IndentStatus.APPROVED]: 'Approved',
  [IndentStatus.REJECTED]: 'Rejected',
  [IndentStatus.PROCESSING]: 'Processing',
  [IndentStatus.COMPLETED]: 'Completed',
};
