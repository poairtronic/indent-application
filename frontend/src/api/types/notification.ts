export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  eventId?: string;
  entityType?: string;
  entityId?: string;
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
  status: 'SENT' | 'FAILED' | 'PENDING';
  eventType?: string;
  createdAt: string;
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
  smtpConnected: boolean;
  queueSize: number;
}

export interface CommunicationQueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export interface CommunicationMetrics {
  sentToday: number;
  failedToday: number;
  avgProcessingTime: number;
}

export interface TestEmailPayload {
  to: string;
  subject?: string;
}
