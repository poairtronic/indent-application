import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../api/services/notifications/hooks';
import * as Lucide from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { filterNotificationsForUser } from '../../utils/notificationFilter';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NOTIFICATION_ICON: Record<string, React.ReactNode> = {
  INFO: <Lucide.Info size={14} className="text-blue-500" />,
  WARNING: <Lucide.AlertTriangle size={14} className="text-yellow-500" />,
  ERROR: <Lucide.AlertCircle size={14} className="text-red-500" />,
  SUCCESS: <Lucide.CheckCircle2 size={14} className="text-green-500" />,
};

const formatRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch {
    return dateStr;
  }
};

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications({ page: 1, limit: 20 });
  const { mutateAsync: markAsRead } = useMarkNotificationRead();
  const { mutateAsync: markAllAsRead } = useMarkAllNotificationsRead();

  const user = useAuthStore((s) => s.user);
  const rawNotifications = data?.items ?? [];
  const notifications = useMemo(() => {
    return filterNotificationsForUser(rawNotifications, user);
  }, [rawNotifications, user]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = useCallback(
    async (id: string) => {
      try {
        await markAsRead(id);
      } catch {
        // silent
      }
    },
    [markAsRead],
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch {
      // silent
    }
  }, [markAllAsRead]);

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-overlay-light z-40 transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-surface-card border-l border-border-default shadow-modal z-50 flex flex-col font-sans transition-all duration-300">
        <div className="p-4 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lucide.Bell className="w-5 h-5 text-accent-primary" />
            <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-accent-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <Lucide.X className="w-4 h-4" />
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-background-secondary border-b border-border-default flex items-center justify-between text-[11px]">
            <button
              onClick={handleMarkAllRead}
              className="text-accent-primary hover:text-accent-hover font-semibold transition-colors focus:outline-none"
            >
              Mark all read
            </button>
            <button
              onClick={handleViewAll}
              className="text-text-muted hover:text-text-primary font-medium transition-colors focus:outline-none"
            >
              View all notifications
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-border-default">
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`skel-${i}`} className="p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-background-secondary" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-background-secondary rounded w-3/4" />
                      <div className="h-2 bg-background-secondary rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-64">
              <Lucide.BellOff className="w-8 h-8 text-text-muted mb-3" />
              <p className="text-xs font-semibold text-text-primary mb-1">All caught up!</p>
              <p className="text-[10px] text-text-muted">
                You have no unread notifications on this terminal.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`p-4 hover:bg-background-secondary transition-colors cursor-pointer flex gap-3 relative ${
                  !n.isRead ? 'bg-accent-primary/5' : ''
                }`}
              >
                {!n.isRead && (
                  <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-accent-primary rounded-full" />
                )}

                <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border-default flex items-center justify-center shrink-0">
                  {NOTIFICATION_ICON[n.type] || (
                    <Lucide.Bell size={14} className="text-text-muted" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <p
                    className={`text-xs text-text-primary ${!n.isRead ? 'font-semibold' : 'font-medium'}`}
                  >
                    {n.title}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-0.5 whitespace-pre-wrap line-clamp-2">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-text-muted">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                    {n.entityType && (
                      <span className="text-[9px] text-text-muted bg-background-secondary px-1 rounded">
                        {n.entityType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
