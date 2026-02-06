'use client';

import { ConfirmModalProvider } from './ConfirmModal';
import { ToastProvider } from './Toast';
import type { ReactNode } from 'react';

export function AdminContent({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmModalProvider>{children}</ConfirmModalProvider>
    </ToastProvider>
  );
}
