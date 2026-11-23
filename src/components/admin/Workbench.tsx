'use client';

import { Smartphone } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { PhonePreview, type PreviewPage } from './PhonePreview';
import { DOCKED_QUERY, useMediaQuery } from './useMediaQuery';

interface WorkbenchProps {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** the open editor; it takes the preview's place in the pane */
  editor: ReactNode | null;
  onCloseEditor: () => void;
  /** leave the preview out for areas that do not change the public page: the editor then opens as a sheet at every width */
  previewPages?: PreviewPage[];
  previewPath?: string;
  onPreviewPathChange?: (path: string) => void;
  previewVersion?: number;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Page frame for the editing areas: the worklist on the left, and a right pane
 * holding the live phone preview, replaced by the editor while one is open.
 * Docked from 1180px; below that the pane is a sheet over the list.
 */
export function Workbench({
  title,
  meta,
  actions,
  children,
  editor,
  onCloseEditor,
  previewPages,
  previewPath,
  onPreviewPathChange,
  previewVersion,
}: WorkbenchProps) {
  const hasPreview = previewPages !== undefined;
  const docked = useMediaQuery(DOCKED_QUERY) && hasPreview;
  const [previewOpen, setPreviewOpen] = useState(false);
  const paneOpen = editor !== null || previewOpen;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (editor !== null) {
        if (isTypingTarget(e.target)) (e.target as HTMLElement).blur();
        onCloseEditor();
      } else if (previewOpen) {
        setPreviewOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editor, onCloseEditor, previewOpen]);

  // keep the page behind a sheet still
  useEffect(() => {
    if (docked || !paneOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [docked, paneOpen]);

  // mount the preview the first time it can be seen, then keep it (hidden under the editor)
  const [previewMounted, setPreviewMounted] = useState(false);
  useEffect(() => {
    if (hasPreview && (docked || previewOpen)) setPreviewMounted(true);
  }, [hasPreview, docked, previewOpen]);
  const previewVisible = editor === null && (docked || previewOpen);

  return (
    <div className="adm-work" data-sheet={hasPreview ? undefined : ''}>
      <div className="adm-work__list">
        <header className="adm-head">
          <div className="adm-head__title">
            <h1>{title}</h1>
            {meta && <span className="adm-head__meta adm-mono">{meta}</span>}
          </div>
          {hasPreview && (
            <button type="button" className="btn btn-ghost adm-head__preview adm-only-narrow" onClick={() => setPreviewOpen(true)}>
              <Smartphone size={17} aria-hidden />
              Preview
            </button>
          )}
          {actions && <div className="adm-head__actions">{actions}</div>}
        </header>
        <div className="adm-work__body">{children}</div>
      </div>

      <div
        className="adm-scrim"
        data-open={paneOpen}
        onClick={() => (editor !== null ? onCloseEditor() : setPreviewOpen(false))}
        aria-hidden
      />
      <aside className="adm-pane" data-open={paneOpen} aria-label={editor ? 'Editor' : 'Preview'}>
        {editor}
        {previewMounted && previewPages && (
          <PhonePreview
            active={previewVisible}
            pages={previewPages}
            path={previewPath ?? '/'}
            onPathChange={onPreviewPathChange ?? (() => {})}
            version={previewVersion ?? 0}
            onClose={docked ? undefined : () => setPreviewOpen(false)}
          />
        )}
      </aside>
    </div>
  );
}
