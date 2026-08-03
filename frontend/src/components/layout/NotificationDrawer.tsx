import React from 'react';
import { useNotifications } from '../../store/notification.store';
import * as Lucide from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, setNotifications } = useNotifications();

  const handleMarkAllRead = () => {
    notifications.forEach((n) => markAsRead(n.id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-surface-card border-l border-border-default shadow-modal z-50 flex flex-col font-sans transition-all duration-300">
        {/* Header */}
        <div className="p-4 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lucide.Bell className="w-5 h-5 text-accent-primary" />
            <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="bg-accent-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {notifications.filter((n) => !n.isRead).length} new
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

        {/* Action Panel */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-background-secondary border-b border-border-default flex items-center justify-between text-[11px]">
            <button
              onClick={handleMarkAllRead}
              className="text-accent-primary hover:text-accent-hover font-semibold transition-colors focus:outline-none"
            >
              Mark all read
            </button>
            <button
              onClick={handleClearAll}
              className="text-status-error hover:underline transition-colors focus:outline-none"
            >
              Clear all logs
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-default">
          {notifications.length === 0 ? (
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
                onClick={() => markAsRead(n.id)}
                className={`p-4 hover:bg-background-secondary transition-colors cursor-pointer flex gap-3 relative ${
                  !n.isRead ? 'bg-accent-primary/5' : ''
                }`}
              >
                {!n.isRead && (
                  <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-accent-primary rounded-full" />
                )}

                <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border-default flex items-center justify-center shrink-0">
                  <span className="text-sm">🔔</span>
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <p
                    className={`text-xs text-text-primary ${!n.isRead ? 'font-semibold' : 'font-medium'}`}
                  >
                    {n.title}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-0.5 whitespace-pre-wrap">
                    {n.message}
                  </p>
                  <span className="text-[9px] text-text-muted mt-1 block">
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
