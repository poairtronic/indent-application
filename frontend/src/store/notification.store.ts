import { create } from 'zustand';
import type { AppNotification } from '../types/notification';

interface NotificationState {
  notifications: AppNotification[];
  setNotifications: (items: AppNotification[]) => void;
  addNotification: (item: AppNotification) => void;
  markAsRead: (id: string) => void;
}

export const useNotifications = create<NotificationState>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (item) => set((state) => ({ notifications: [item, ...state.notifications] })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    })),
}));
