import { apiFetch } from './api';

export const notificationService = {
  getAll: async () => {
    return apiFetch('/notifications');
  },

  markAsRead: async (id: string) => {
    return apiFetch(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },
};
