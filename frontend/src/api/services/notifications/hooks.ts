import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { notificationService } from './service';
import type { NotificationQueryParams } from '../../types/notification';

export function useNotifications(params?: NotificationQueryParams, enabled?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.notifications.list('notifications'), params],
    queryFn: () => notificationService.list(params),
    enabled: enabled !== undefined ? enabled : true,
    staleTime: 30000,
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

export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list('notifications') });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.detail('notifications', 'unread'),
      });
    },
  });
}

/**
 * Unread notification polling configuration:
 * - Active tab interval: 5 minutes (300,000ms), customizable via VITE_NOTIFICATION_POLL_INTERVAL_MS.
 * - Inactive/hidden tabs: Polling stops completely (refetchIntervalInBackground: false).
 * - Focus recovery: Immediate freshness refresh upon returning to tab (refetchOnWindowFocus: true).
 * - Cache deduplication: 60s staleTime prevents duplicate requests across concurrent components.
 */
export const DEFAULT_NOTIFICATION_POLL_INTERVAL_MS = 300_000; // 5 minutes
export const NOTIFICATION_STALE_TIME_MS = 60_000; // 1 minute

export function getNotificationPollInterval(): number {
  const envVal = import.meta.env.VITE_NOTIFICATION_POLL_INTERVAL_MS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_NOTIFICATION_POLL_INTERVAL_MS;
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.detail('notifications', 'unread'),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: NOTIFICATION_STALE_TIME_MS,
    refetchInterval: getNotificationPollInterval(),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
