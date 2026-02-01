'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-b-2 border-primary',
        sizeStyles[size],
        className,
      )}
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
