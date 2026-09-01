export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  readAt?: string | null;
  eventId?: string;
  entityType?: string;
  entityId?: string;
  referenceModule?: string;
  createdBy?: string;
  creator?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  } | null;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
}

export interface CommunicationLog {
  id: string;
  to: string;
  subject: string;
  status: 'SENT' | 'FAILED' | 'PENDING' | 'QUEUED';
  errorMessage?: string | null;
  retryCount?: number;
  sentAt: string;
  user?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  } | null;
}

export interface PaginatedCommunicationLogs {
  items: CommunicationLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommunicationLogQueryParams {
  page?: number;
  limit?: number;
  status?: 'SENT' | 'FAILED' | 'PENDING';
}

export interface CommunicationHealth {
  status: string;
  /** @deprecated Redis is removed; this field is always 'UP' (PostgreSQL queue is healthy). */
  redis?: string;
  provider?: string;
  providerStatus?: string;
  smtp?: string;
  timestamp: string;
}

export interface CommunicationQueueStats {
  mailQueue: {
    active: number;
    waiting: number;
    delayed: number;
    failed: number;
  };
  deadQueue: {
    total: number;
  };
  timestamp: string;
}

export interface CommunicationMetrics {
  throughput: {
    totalProcessed: number;
    completed: number;
    failed: number;
    successRatePercentage: number;
  };
  timestamp: string;
}

export interface TestEmailPayload {
  to: string;
  subject?: string;
}
