/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useClearAllNotifications,
  DEFAULT_NOTIFICATION_POLL_INTERVAL_MS,
  NOTIFICATION_STALE_TIME_MS,
  getNotificationPollInterval,
} from '../api/services/notifications/hooks';
import { notificationService } from '../api/services/notifications/service';
import { queryKeys } from '../api/hooks/query-keys';

describe('useUnreadNotificationCount Polling Optimization (Phase 5)', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false, // Default global behavior
        },
      },
    });
  });

  it('should have 300,000ms (5 minutes) default polling interval and 60,000ms stale time', () => {
    expect(DEFAULT_NOTIFICATION_POLL_INTERVAL_MS).toBe(300_000);
    expect(NOTIFICATION_STALE_TIME_MS).toBe(60_000);
    expect(getNotificationPollInterval()).toBe(300_000);
  });

  it('should configure refetchIntervalInBackground as false and refetchOnWindowFocus as true', async () => {
    const getUnreadSpy = vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(5);

    const { result } = renderHook(() => useUnreadNotificationCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(5);
    expect(getUnreadSpy).toHaveBeenCalledTimes(1);

    // Verify query instance configuration from QueryCache
    const query = queryClient.getQueryCache().find({
      queryKey: queryKeys.notifications.detail('notifications', 'unread'),
    });

    expect(query).toBeDefined();
    const options = query?.options as Record<string, any> | undefined;
    expect(options?.refetchIntervalInBackground).toBe(false);
    expect(options?.refetchInterval).toBe(300_000);
    expect(options?.refetchOnWindowFocus).toBe(true);
    expect(options?.staleTime).toBe(60_000);
    expect(options?.retry).toBe(false);
  });

  it('should deduplicate simultaneous hook calls across multiple components into 1 single API call', async () => {
    const getUnreadSpy = vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(3);
    const wrapper = createWrapper();

    // Simulate 3 components mounting at the same time (e.g. Header, DashboardPage, NotificationsPage)
    const { result: res1 } = renderHook(() => useUnreadNotificationCount(), { wrapper });
    const { result: res2 } = renderHook(() => useUnreadNotificationCount(), { wrapper });
    const { result: res3 } = renderHook(() => useUnreadNotificationCount(), { wrapper });

    await waitFor(() => {
      expect(res1.current.isSuccess).toBe(true);
      expect(res2.current.isSuccess).toBe(true);
      expect(res3.current.isSuccess).toBe(true);
    });

    expect(res1.current.data).toBe(3);
    expect(res2.current.data).toBe(3);
    expect(res3.current.data).toBe(3);

    // Exactly one network call was dispatched
    expect(getUnreadSpy).toHaveBeenCalledTimes(1);
  });

  it('should invalidate unread count query cache on markAsRead mutation', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(2);
    const markReadSpy = vi.spyOn(notificationService, 'markAsRead').mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = createWrapper();
    const { result: countHook } = renderHook(() => useUnreadNotificationCount(), { wrapper });
    const { result: markHook } = renderHook(() => useMarkNotificationRead(), { wrapper });

    await waitFor(() => expect(countHook.current.isSuccess).toBe(true));

    await markHook.current.mutateAsync('notif-123');
    expect(markReadSpy).toHaveBeenCalledWith('notif-123');

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.detail('notifications', 'unread'),
    });
  });

  it('should invalidate unread count query cache on markAllAsRead mutation', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(4);
    const markAllSpy = vi.spyOn(notificationService, 'markAllAsRead').mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = createWrapper();
    const { result: countHook } = renderHook(() => useUnreadNotificationCount(), { wrapper });
    const { result: markAllHook } = renderHook(() => useMarkAllNotificationsRead(), { wrapper });

    await waitFor(() => expect(countHook.current.isSuccess).toBe(true));

    await markAllHook.current.mutateAsync();
    expect(markAllSpy).toHaveBeenCalledTimes(1);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.detail('notifications', 'unread'),
    });
  });

  it('should invalidate unread count query cache on clearAll mutation', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(1);
    const clearAllSpy = vi.spyOn(notificationService, 'clearAll').mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = createWrapper();
    const { result: countHook } = renderHook(() => useUnreadNotificationCount(), { wrapper });
    const { result: clearAllHook } = renderHook(() => useClearAllNotifications(), { wrapper });

    await waitFor(() => expect(countHook.current.isSuccess).toBe(true));

    await clearAllHook.current.mutateAsync();
    expect(clearAllSpy).toHaveBeenCalledTimes(1);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.detail('notifications', 'unread'),
    });
  });
});
