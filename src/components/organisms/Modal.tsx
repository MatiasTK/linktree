'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={cn('bg-card rounded-xl border border-border p-6 w-full max-w-md my-8', className)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface SwapWarningModalProps {
  isOpen: boolean;
  message: string;
  conflictLabel: string;
  newOrder: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SwapWarningModal({
  isOpen,
  message,
  conflictLabel,
  newOrder,
  onCancel,
  onConfirm,
}: SwapWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4 text-yellow-500">Order Conflict</h2>
        <p className="text-muted-foreground mb-4">{message}</p>
        <p className="text-sm mb-6">
          &quot;{conflictLabel}&quot; will get order {newOrder + 1} instead.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-primary flex-1">
            Swap Orders
          </button>
        </div>
      </div>
    </div>
  );
}
