'use client';

import { ExternalLink, RotateCw, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const PHONE_W = 390;
const PHONE_H = 844;
const BEZEL = 10;

export interface PreviewPage {
  path: string;
  label: string;
}

interface PhonePreviewProps {
  pages: PreviewPage[];
  path: string;
  onPathChange: (path: string) => void;
  /** bump to reload the page after a save */
  version: number;
  /** false while the editor covers the preview; a pending reload plays once it is visible again */
  active: boolean;
  /** narrow screens: the preview is a sheet that can be closed */
  onClose?: () => void;
}

/**
 * The real public page, at phone size, scaled to fit the pane. Saving elsewhere
 * bumps `version`: the screen is wiped by the plate and the page reloads under it.
 */
export function PhonePreview({ pages, path, onPathChange, version, active, onClose }: PhonePreviewProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.8);
  const [reloading, setReloading] = useState<boolean | null>(null);
  const playedVersion = useRef(version);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const style = getComputedStyle(stage);
      const w = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const h = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const s = Math.min(1, w / (PHONE_W + BEZEL * 2), h / (PHONE_H + BEZEL * 2));
      setScale(Math.max(0.3, Math.floor(s * 1000) / 1000));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // a save: once visible, cover the screen, reload the frame under it; it uncovers on load
  useEffect(() => {
    if (!active || version === playedVersion.current) return;
    playedVersion.current = version;
    setReloading(true);
    const timer = window.setTimeout(() => {
      try {
        frameRef.current?.contentWindow?.location.reload();
      } catch {
        if (frameRef.current) frameRef.current.src = frameRef.current.src;
      }
    }, 160);
    return () => window.clearTimeout(timer);
  }, [version, active]);

  const reload = () => {
    setReloading(true);
    window.setTimeout(() => frameRef.current?.contentWindow?.location.reload(), 160);
  };

  const options = pages.some((p) => p.path === path) ? pages : [...pages, { path, label: path }];

  return (
    <section className="adm-preview" aria-label="Live preview" hidden={!active}>
      <div className="adm-preview__bar">
        <span className="adm-preview__label">Preview</span>
        <select
          className="select"
          value={path}
          onChange={(e) => onPathChange(e.target.value)}
          aria-label="Page to preview"
        >
          {options.map((p) => (
            <option key={p.path} value={p.path}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="button" className="adm-tool" onClick={reload} title="Reload preview">
          <RotateCw size={17} aria-hidden />
          <span className="sr-only">Reload preview</span>
        </button>
        <a href={path} target="_blank" rel="noopener noreferrer" className="adm-tool" title="Open in a new tab">
          <ExternalLink size={17} aria-hidden />
          <span className="sr-only">Open in a new tab</span>
        </a>
        {onClose && (
          <button type="button" className="adm-tool adm-only-narrow" onClick={onClose} title="Close preview">
            <X size={18} aria-hidden />
            <span className="sr-only">Close preview</span>
          </button>
        )}
      </div>
      <div className="adm-preview__stage" ref={stageRef}>
        <div
          className="adm-phone"
          style={{ '--s': scale } as React.CSSProperties}
          data-reloading={reloading === null ? undefined : String(reloading)}
        >
          <div className="adm-phone__screen" style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
            <iframe
              ref={frameRef}
              src={path}
              title={`Preview of ${path}`}
              width={PHONE_W}
              height={PHONE_H}
              style={{ transform: `scale(${scale})` }}
              onLoad={() => setReloading((r) => (r ? false : r))}
            />
            <div className="adm-phone__wipe" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
