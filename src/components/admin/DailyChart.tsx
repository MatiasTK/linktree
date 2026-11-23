'use client';

import type { DayCount } from '@/lib/stats-time';
import { useId, useState } from 'react';

const H = 180;
const PAD_TOP = 12;
const PAD_BOTTOM = 26;
const AXIS_W = 34;

function niceMax(max: number) {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * pow >= max) return step * pow;
  }
  return 10 * pow;
}

const dayFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const longFormat = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmt = (day: string, f = dayFormat) => f.format(new Date(`${day}T00:00:00Z`));

/** Clicks per day: one column per day, a hover/focus readout, and a table view. */
export function DailyChart({ days }: { days: DayCount[] }) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const [width, setWidth] = useState(720);

  const max = niceMax(Math.max(0, ...days.map((d) => d.clicks)));
  const plotW = width - AXIS_W;
  const slot = plotW / Math.max(1, days.length);
  const barW = Math.max(2, Math.min(24, slot - 2));
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const y = (v: number) => PAD_TOP + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  // one date label per ~56px, on whole weeks once the days are dense
  const fit = Math.max(1, Math.ceil(56 / slot));
  const labelEvery = fit === 1 ? 1 : fit <= 7 ? 7 : fit <= 14 ? 14 : 30;

  const current = active === null ? null : days[active];

  return (
    <div className="adm-chart">
      <div
        className="adm-chart__plot"
        ref={(el) => {
          if (!el) return;
          const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
          observer.observe(el);
          return () => observer.disconnect();
        }}
        onPointerLeave={() => setActive(null)}
      >
        <svg width={width} height={H} role="img" aria-labelledby={`${id}-desc`}>
          <desc id={`${id}-desc`}>
            Clicks per day, {fmt(days[0]?.day ?? '1970-01-01')} to {fmt(days[days.length - 1]?.day ?? '1970-01-01')}. The table below
            lists every day.
          </desc>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={AXIS_W} x2={width} y1={y(t)} y2={y(t)} className="adm-chart__grid" />
              <text x={AXIS_W - 8} y={y(t)} className="adm-chart__tick" textAnchor="end" dominantBaseline="middle">
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          ))}
          {days.map((d, i) => {
            const cx = AXIS_W + slot * i + slot / 2;
            const top = y(d.clicks);
            const h = PAD_TOP + plotH - top;
            const r = Math.min(4, barW / 2, h);
            const x = cx - barW / 2;
            const base = PAD_TOP + plotH;
            return (
              <g key={d.day}>
                {d.clicks > 0 && (
                  <path
                    className="adm-chart__bar"
                    data-active={active === i || undefined}
                    d={`M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${base} Z`}
                  />
                )}
                {(i % labelEvery === 0 || i === days.length - 1) && (days.length - 1 - i >= labelEvery / 2 || i === days.length - 1) && (
                  <text x={cx} y={H - 8} className="adm-chart__tick" textAnchor="middle">
                    {i === days.length - 1 ? 'Today' : fmt(d.day)}
                  </text>
                )}
                <rect
                  x={AXIS_W + slot * i}
                  y={PAD_TOP}
                  width={slot}
                  height={plotH}
                  className="adm-chart__hit"
                  tabIndex={0}
                  aria-label={`${fmt(d.day, longFormat)}: ${d.clicks} clicks`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}
        </svg>
        {current && active !== null && (
          <div
            className="adm-chart__tip"
            style={{
              left: Math.min(width - 70, Math.max(70, AXIS_W + slot * active + slot / 2)),
              top: Math.max(0, y(current.clicks) - 10),
            }}
            aria-hidden
          >
            <strong className="adm-mono">{current.clicks}</strong>
            <span>{fmt(current.day, longFormat)}</span>
          </div>
        )}
      </div>
      <details className="adm-chart__table">
        <summary>Show as table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.day}>
                <td>{fmt(d.day, longFormat)}</td>
                <td className="adm-mono">{d.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
