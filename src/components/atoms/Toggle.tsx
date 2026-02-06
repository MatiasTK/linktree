'use client';

import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Toggle({ label, className, id, ...props }: ToggleProps) {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <label className="toggle-switch">
        <input type="checkbox" id={toggleId} {...props} />
        <span className="toggle-slider"></span>
      </label>
      {label && (
        <label htmlFor={toggleId} className="text-sm cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
}
