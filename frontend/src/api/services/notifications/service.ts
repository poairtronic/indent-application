import { BaseService } from '../base.service';
import type {
  NotificationResponse,
  PaginatedNotifications,
  NotificationQueryParams,
} from '../../types/notification';
import type { ListQueryParams } from '../../types/query-params';

class NotificationService extends BaseService {
  constructor() {
    super({ basePath: '/notifications' });
  }

  async list(params?: NotificationQueryParams): Promise<PaginatedNotifications> {
    return this.getList<NotificationResponse>(params as ListQueryParams | undefined);
  }

  async markAsRead(id: string): Promise<void> {
    await this.patch(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await this.patch('/notifications/read-all');
  }

  async clearAll(): Promise<void> {
    await this.delete('/notifications/clear-all');
  }

  async getUnreadCount(): Promise<number> {
    return this.get<number>('/notifications/unread-count');
  }
}

export const notificationService = new NotificationService();
