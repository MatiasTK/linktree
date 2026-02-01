'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
}

export function FormField({ label, required, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-medium">
        {label}
        {required && ' *'}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Convenience wrapper for Input with FormField
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormInput({ label, error, hint, required, ...props }: FormInputProps) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <Input error={!!error} required={required} {...props} />
    </FormField>
  );
}

// Convenience wrapper for Select with FormField
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormSelect({ label, error, hint, required, children, ...props }: FormSelectProps) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <Select error={!!error} required={required} {...props}>
        {children}
      </Select>
    </FormField>
  );
}
