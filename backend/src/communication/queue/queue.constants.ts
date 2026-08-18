/**
 * Phase 16B - Enterprise Email Queue Constants
 */

export const MAIL_QUEUE_NAME = 'mail.queue';
export const MAIL_DEAD_QUEUE_NAME = 'mail.dead.queue';

export enum EmailState {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  RETRYING = 'RETRYING',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  DEAD_LETTER = 'DEAD_LETTER',
}

export interface IJobPayload {
  jobId: string;
  emailLogIds?: string[];
  recipient: string;
  recipients: string[];
  template: string;
  subject: string;
  businessEvent: string;
  payload: Record<string, any>;
  attachments?: { filename: string; path?: string; content?: any; contentType?: string }[];
  priority: number; // 1 = High, 5 = Low
  retryCount: number;
  createdTime: string;
  requestedBy: string;
  correlationId: string;
  transactionId?: string;
  department?: string;
  retryHistory?: { attempt: number; timestamp: string; error?: string }[];
}
