'use client';

import { Trash2, X } from 'lucide-react';
import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';

interface EditorPanelProps {
  title: string;
  /** the label of the one orange key */
  submitLabel: string;
  saving: boolean;
  error?: string | null;
  onSubmit: () => void;
  onClose: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  children: ReactNode;
}

/** The pane's editor: a form with a fixed head and a footer holding the Save key. */
export function EditorPanel({
  title,
  submitLabel,
  saving,
  error,
  onSubmit,
  onClose,
  onDelete,
  deleteLabel = 'Delete',
  children,
}: EditorPanelProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // land in the first field, so typing can start right away
  useEffect(() => {
    const first = formRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select');
    first?.focus({ preventScroll: true });
  }, [title]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!saving) onSubmit();
  };

  return (
    <form
      ref={formRef}
      className="adm-panel"
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          if (!saving) onSubmit();
        }
      }}
      noValidate
    >
      <div className="adm-panel__head">
        <h2>{title}</h2>
        <button type="button" className="adm-panel__close" onClick={onClose}>
          <span className="adm-kbd adm-kbd--hint" aria-hidden>
            Esc
          </span>
          <X size={18} aria-hidden />
          <span className="sr-only">Close editor</span>
        </button>
      </div>
      <div className="adm-panel__body">
        {error && (
          <p className="adm-panel__error" role="alert">
            {error}
          </p>
        )}
        {children}
      </div>
      <div className="adm-panel__foot">
        {onDelete && (
          <button type="button" className="btn btn-danger" onClick={onDelete} disabled={saving}>
            <Trash2 size={16} aria-hidden />
            {deleteLabel}
          </button>
        )}
        <span className="adm-spacer" />
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
