'use client';

import { useToast } from '@/components/Toast';
import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Copies a path made absolute against the current origin (or a full URL as is). */
export function CopyButton({ value, label = 'Copy link', withText = false }: { value: string; label?: string; withText?: boolean }) {
  const toast = useToast();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1400);
    return () => clearTimeout(t);
  }, [done]);

  const copy = async () => {
    const text = value.startsWith('/') ? `${window.location.origin}${value}` : value;
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
    } catch {
      toast.error('Could not reach the clipboard. Copy the address by hand.');
    }
  };

  const Icon = done ? Check : Copy;
  return (
    <button
      type="button"
      className={withText ? 'btn btn-ghost' : 'adm-tool'}
      onClick={copy}
      title={label}
      aria-live="polite"
    >
      <Icon size={withText ? 16 : 17} aria-hidden />
      {withText ? (done ? 'Copied' : label) : <span className="sr-only">{done ? 'Copied' : label}</span>}
    </button>
  );
}
