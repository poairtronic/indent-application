import React, { useCallback, useRef, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface ToastState {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (type: 'success' | 'error', message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return { toasts, show, dismiss };
}

interface ToastViewportProps {
  toasts: ToastState[];
  onDismiss: (id: number) => void;
}

export const ToastViewport: React.FC<ToastViewportProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 rounded-md px-4 py-3 shadow-lg text-sm text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="ml-2 text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
