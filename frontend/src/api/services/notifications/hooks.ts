import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { notificationService } from './service';
import type { NotificationQueryParams } from '../../types/notification';

export function useNotifications(params?: NotificationQueryParams, enabled?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.notifications.list('notifications'), params],
    queryFn: () => notificationService.list(params),
    enabled: enabled !== undefined ? enabled : true,
    retry: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list('notifications') });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.detail('notifications', 'unread'),
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list('notifications') });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.detail('notifications', 'unread'),
      });
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.detail('notifications', 'unread'),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30000,
    refetchInterval: 150000,
    retry: false,
  });
}
