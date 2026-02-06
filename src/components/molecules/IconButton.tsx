'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  size?: number;
  variant?: 'default' | 'success' | 'danger' | 'muted';
}

const variantStyles = {
  default: 'text-muted-foreground hover:bg-accent',
  success: 'text-green-500 hover:bg-green-500/10',
  danger: 'text-destructive hover:bg-destructive/10',
  muted: 'text-muted-foreground hover:bg-accent',
};

export function IconButton({
  icon: Icon,
  size = 18,
  variant = 'default',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn('p-2 rounded-lg transition-colors', variantStyles[variant], className)}
      {...props}
    >
      <Icon size={size} />
    </button>
  );
}
