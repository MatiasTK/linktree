'use client';

import { useEffect, useRef, useState } from 'react';

export interface Sample {
  /** second, 1-based */
  t: number;
  wpm: number;
  raw: number;
  errors: number;
}

const H = 176;
const PAD = { top: 14, right: 12, bottom: 26, left: 34 };

function niceMax(v: number) {
  return Math.max(40, Math.ceil((v * 1.1) / 20) * 20);
}

/** WPM and raw speed per second, with the seconds that had misses marked on the baseline. */
export function ResultChart({ samples }: { samples: Sample[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = samples.length;
  const max = niceMax(Math.max(0, ...samples.map((s) => Math.max(s.wpm, s.raw))));
  const iw = Math.max(0, w - PAD.left - PAD.right);
  const ih = H - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + (n <= 1 ? iw / 2 : ((t - 1) / (n - 1)) * iw);
  const y = (v: number) => PAD.top + ih - (v / max) * ih;
  const path = (key: 'wpm' | 'raw') =>
    samples.map((s, i) => `${i ? 'L' : 'M'}${x(s.t).toFixed(1)},${y(s[key]).toFixed(1)}`).join('');
  const ticks = [0, max / 2, max];
  const xTicks = n <= 1 ? samples.map((s) => s.t) : [1, Math.ceil(n / 2), n].filter((v, i, a) => a.indexOf(v) === i);
  const last = samples[n - 1];
  const h = hover !== null ? samples[hover] : null;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!n || iw <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    const i = n <= 1 ? 0 : Math.round((px / iw) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <figure className="rc">
      <figcaption className="rc__legend">
        <span>
          <i className="rc__swatch rc__swatch--wpm" aria-hidden /> wpm
        </span>
        <span>
          <i className="rc__swatch rc__swatch--raw" aria-hidden /> raw
        </span>
        <span>
          <i className="rc__swatch rc__swatch--err" aria-hidden /> misses
        </span>
      </figcaption>
      <div ref={boxRef} className="rc__plot">
        {w > 0 && n > 0 && (
          <svg
            width={w}
            height={H}
            role="img"
            aria-label={`Speed per second: ended at ${Math.round(last.wpm)} wpm, raw ${Math.round(last.raw)}`}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            {ticks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={PAD.left + iw} y1={y(v)} y2={y(v)} className="rc__grid" />
                <text x={PAD.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="rc__axis">
                  {Math.round(v)}
                </text>
              </g>
            ))}
            {xTicks.map((t) => (
              <text key={t} x={x(t)} y={H - 6} textAnchor="middle" className="rc__axis">
                {t}s
              </text>
            ))}
            <path d={path('raw')} className="rc__line rc__line--raw" />
            <path d={path('wpm')} className="rc__line rc__line--wpm" />
            {samples.map((s) =>
              s.errors > 0 ? (
                <circle key={s.t} cx={x(s.t)} cy={PAD.top + ih} r={4} className="rc__err" />
              ) : null,
            )}
            {h && (
              <g>
                <line x1={x(h.t)} x2={x(h.t)} y1={PAD.top} y2={PAD.top + ih} className="rc__cross" />
                <circle cx={x(h.t)} cy={y(h.wpm)} r={4.5} className="rc__dot" />
              </g>
            )}
          </svg>
        )}
        {h && (
          <div
            className="rc__tip"
            style={{ left: Math.min(Math.max(x(h.t), 70), w - 70), top: Math.max(0, y(Math.max(h.wpm, h.raw)) - 64) }}
          >
            <strong>{h.t}s</strong>
            <span>
              {Math.round(h.wpm)} wpm · {Math.round(h.raw)} raw
            </span>
            {h.errors > 0 && <span>{h.errors} missed</span>}
          </div>
        )}
      </div>
    </figure>
  );
}
