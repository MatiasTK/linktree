'use client';

import { AlertTriangle, Info, Trash2, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmModalContext = createContext<ConfirmModalContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmModalProvider');
  }
  return context.confirm;
}

const icons: Record<ConfirmVariant, ReactNode> = {
  danger: <Trash2 size={24} />,
  warning: <AlertTriangle size={24} />,
  info: <Info size={24} />,
};

const iconStyles: Record<ConfirmVariant, string> = {
  danger: 'bg-destructive/10 text-destructive',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  info: 'bg-primary/10 text-primary',
};

const buttonStyles: Record<ConfirmVariant, string> = {
  danger: 'btn-destructive',
  warning: 'bg-yellow-500 text-white hover:opacity-90',
  info: 'btn-primary',
};

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(true);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(false);
  }, [resolvePromise]);

  const variant = options?.variant || 'danger';

  return (
    <ConfirmModalContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${iconStyles[variant]}`}>
                {icons[variant]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{options.title}</h2>
                  <button
                    onClick={handleCancel}
                    className="p-1 rounded-lg text-muted-foreground hover:bg-accent transition-colors -mt-1 -mr-1"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-muted-foreground mt-2">{options.message}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCancel} className="btn btn-secondary flex-1">
                {options.cancelText || 'Cancel'}
              </button>
              <button onClick={handleConfirm} className={`btn flex-1 ${buttonStyles[variant]}`}>
                {options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmModalContext.Provider>
  );
}
