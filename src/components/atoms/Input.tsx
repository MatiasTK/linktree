'use client';

import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'input',
          error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
