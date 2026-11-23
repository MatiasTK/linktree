'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

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

/** Confirmation for destructive actions, on the native <dialog> (focus trap and Esc for free). */
export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (options && dialog && !dialog.open) dialog.showModal();
  }, [options]);

  const settle = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    dialogRef.current?.close();
    setOptions(null);
  }, []);

  const variant = options?.variant ?? 'danger';

  return (
    <ConfirmModalContext.Provider value={{ confirm }}>
      {children}
      <dialog
        ref={dialogRef}
        className="adm-dialog"
        onCancel={(e) => {
          e.preventDefault();
          settle(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) settle(false);
        }}
      >
        {options && (
          <div className="adm-dialog__body">
            <h2>{options.title}</h2>
            <p>{options.message}</p>
            <div className="adm-dialog__actions">
              <button type="button" className="btn btn-ghost" onClick={() => settle(false)} autoFocus>
                {options.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                className={`btn ${variant === 'danger' ? 'btn-destructive' : 'btn-primary'}`}
                onClick={() => settle(true)}
              >
                {options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmModalContext.Provider>
  );
}
