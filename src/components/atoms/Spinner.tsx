'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-5 w-5',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn('animate-spin rounded-full border-[3px]', sizeStyles[size], className)}
      style={{
        borderColor: 'var(--border)',
        borderTopColor: 'var(--primary)',
      }}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner />
    </div>
  );
}
