'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ message, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('p-12 text-center text-muted-foreground', className)}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <p>{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
