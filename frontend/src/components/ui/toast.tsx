import React, { useCallback, useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastState {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  progress?: number;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (
      type: 'success' | 'error' | 'info' | 'warning',
      message: string,
      options?: {
        actionLabel?: string;
        onAction?: () => void;
        duration?: number;
        progress?: number;
      },
    ) => {
      const id = ++idRef.current;
      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          message,
          actionLabel: options?.actionLabel,
          onAction: options?.onAction,
          progress: options?.progress,
        },
      ]);
      const dur = options?.duration ?? 4000;
      setTimeout(() => dismiss(id), dur);
    },
    [dismiss],
  );

  return { toasts, show, dismiss };
}

interface ToastViewportProps {
  toasts: ToastState[];
  onDismiss: (id: number) => void;
}

const toastBg = {
  success: 'bg-status-success',
  error: 'bg-status-error',
  info: 'bg-accent-primary',
  warning: 'bg-status-warning',
};

const toastIcon = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
  warning: <AlertTriangle size={16} />,
};

export const ToastViewport: React.FC<ToastViewportProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2 font-sans text-xs">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex flex-col gap-2 rounded-xl p-4 shadow-2xl text-white min-w-72 max-w-sm animate-toast-in ${toastBg[toast.type]}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="shrink-0">{toastIcon[toast.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{toast.message}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    onDismiss(toast.id);
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wider focus:outline-none"
                >
                  {toast.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-white/70 hover:text-white transition-colors p-0.5 rounded focus:outline-none"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {toast.progress !== undefined && (
            <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, toast.progress))}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
