'use client';

import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++toastId;
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
      setTimeout(() => removeToast(id), type === 'error' ? 6000 : 3200);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextType>(
    () => ({
      toast: addToast,
      success: (message) => addToast(message, 'success'),
      error: (message) => addToast(message, 'error'),
      info: (message) => addToast(message, 'info'),
      warning: (message) => addToast(message, 'warning'),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="adm-toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="adm-toast" data-type={toast.type}>
            {toast.type === 'success' && <span className="adm-toast__dot" aria-hidden />}
            <span>{toast.message}</span>
            <button type="button" onClick={() => removeToast(toast.id)} aria-label="Dismiss">
              <X size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
