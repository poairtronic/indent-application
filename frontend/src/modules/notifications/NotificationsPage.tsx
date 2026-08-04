import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useUnreadNotificationCount,
} from '../../api/services/notifications/hooks';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { ToastViewport, useToasts } from '../../components/ui/toast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  Bell,
  BellOff,
  CheckCheck,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  FileText,
} from 'lucide-react';

const NOTIFICATION_TYPE_TONE: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
  INFO: 'blue',
  WARNING: 'yellow',
  ERROR: 'red',
  SUCCESS: 'green',
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
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toasts, show, dismiss } = useToasts();
  const { data: unreadCount } = useUnreadNotificationCount();
  const { mutateAsync: markAsRead } = useMarkNotificationRead();
  const { mutateAsync: markAllAsRead } = useMarkAllNotificationsRead();

  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchInput, 300);

  const queryParams = {
    page,
    limit: 20,
    search: search || undefined,
    type: filterType || undefined,
  };

  const { data, isLoading, refetch, isFetching } = useNotifications(queryParams);

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsRead(id);
        refetch();
      } catch {
        show('error', 'Failed to mark notification as read.');
      }
    },
    [markAsRead, refetch, show],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      show('success', 'All notifications marked as read.');
      refetch();
    } catch {
      show('error', 'Failed to mark all notifications as read.');
    }
  }, [markAllAsRead, refetch, show]);

  const notifications = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="p-2"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Bell className="text-accent-primary" />
              Notifications
              {unreadCount !== undefined && unreadCount > 0 && (
                <span className="text-sm font-medium text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              View workflow notifications and system alerts
            </p>
          </div>
        </div>
        {unreadCount !== undefined && unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck size={16} />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
            <Input
              placeholder="Search notifications..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-border-default bg-surface-card text-text-primary text-sm"
            >
              <option value="">All Types</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="SUCCESS">Success</option>
            </select>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2"
        >
          <Filter size={14} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-surface-card border border-border-default rounded-xl p-4 shadow-card animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-background-secondary rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-background-secondary rounded w-3/4" />
                  <div className="h-3 bg-background-secondary rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
          <BellOff size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">No notifications</p>
          <p className="text-xs text-text-muted">
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification: any) => {
            const isUnread = !notification.isRead;
            return (
              <div
                key={notification.id}
                className={`bg-surface-card border rounded-xl p-4 shadow-card transition-colors ${
                  isUnread
                    ? 'border-accent-primary/30 bg-accent-primary/5'
                    : 'border-border-default'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isUnread ? 'bg-accent-primary/10' : 'bg-background-secondary'
                    }`}
                  >
                    <Bell
                      size={18}
                      className={isUnread ? 'text-accent-primary' : 'text-text-muted'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-medium ${isUnread ? 'text-text-primary' : 'text-text-secondary'}`}
                      >
                        {notification.title}
                      </p>
                      <Badge tone={NOTIFICATION_TYPE_TONE[notification.type] ?? 'gray'}>
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Clock size={10} />
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      {notification.referenceModule && (
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                          <FileText size={10} />
                          {notification.referenceModule}
                        </span>
                      )}
                    </div>
                  </div>
                  {isUnread && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="shrink-0 text-xs"
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={20}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};
