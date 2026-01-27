'use client';

import { ToastProvider } from './Toast';
import type { ReactNode } from 'react';

export function AdminContent({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
