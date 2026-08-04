export interface AppNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  entityType?: string;
  entityId?: string;
  referenceModule?: string;
  createdAt: string;
}
