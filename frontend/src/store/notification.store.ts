import { useState, useEffect } from 'react';
import type { AppNotification } from '../types/notification';

let notifications: AppNotification[] = [];
const listeners = new Set<(notifications: AppNotification[]) => void>();

const emit = () => {
  listeners.forEach((listener) => listener([...notifications]));
};

export const notificationStore = {
  get notifications() {
    return notifications;
  },
  setNotifications(items: AppNotification[]) {
    notifications = items;
    emit();
  },
  add(item: AppNotification) {
    notifications.unshift(item);
    emit();
  },
  markRead(id: string) {
    notifications = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    emit();
  },
  subscribe(listener: (notifications: AppNotification[]) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useNotifications = () => {
  const [list, setList] = useState<AppNotification[]>(notifications);

  useEffect(() => {
    return notificationStore.subscribe((newList) => {
      setList(newList);
    });
  }, []);

  return {
    notifications: list,
    addNotification: (item: AppNotification) => notificationStore.add(item),
    markAsRead: (id: string) => notificationStore.markRead(id),
  };
};
