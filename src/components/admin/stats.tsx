import type { NamedCount } from '@/lib/stats-time';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';

export const number = new Intl.NumberFormat('en');

/** Display names for the traffic source tags (click-source.ts and the ?s= aliases). */
export const SOURCE_NAMES: Record<string, string> = {
  direct: 'Direct or unknown',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  github: 'GitHub',
  reddit: 'Reddit',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  discord: 'Discord',
  google: 'Google',
  bing: 'Bing',
  duckduckgo: 'DuckDuckGo',
  qr: 'QR code',
  email: 'Email',
};

function change(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { label: 'new', dir: 'up' as const } : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { label: '±0%', dir: 'flat' as const };
  return { label: `${pct > 0 ? '+' : ''}${pct}%`, dir: pct > 0 ? ('up' as const) : ('down' as const) };
}

export function Change({ current, previous }: { current: number; previous: number }) {
  const c = change(current, previous);
  if (!c) return <span className="adm-delta adm-mono">–</span>;
  return (
    <span className="adm-delta adm-mono" data-dir={c.dir}>
      {c.dir === 'up' && <ArrowUpRight size={14} aria-hidden />}
      {c.dir === 'down' && <ArrowDownRight size={14} aria-hidden />}
      {c.label}
    </span>
  );
}

interface RankingProps {
  title: string;
  rows: NamedCount[];
  total: number;
  names?: Record<string, string>;
  /** custom rendering of a row's name (wins over `names`) */
  label?: (name: string) => ReactNode;
  limit?: number;
  empty?: string;
}

export function Ranking({ title, rows, total, names, label, limit = 8, empty = 'Nothing yet in this period.' }: RankingProps) {
  const max = Math.max(1, ...rows.map((r) => r.clicks));
  const id = `rank-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const rest = rows.length - limit;
  return (
    <section className="adm-panel-card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {rows.length === 0 ? (
        <p className="adm-panel-card__empty">{empty}</p>
      ) : (
        <ol className="adm-rank">
          {rows.slice(0, limit).map((row) => (
            <li key={row.name}>
              <span className="adm-rank__name">{label ? label(row.name) : (names?.[row.name] ?? row.name)}</span>
              <span className="adm-rank__value adm-mono">
                {number.format(row.clicks)}
                <small>{Math.round((row.clicks / Math.max(1, total)) * 100)}%</small>
              </span>
              <span className="adm-rank__bar" style={{ width: `${(row.clicks / max) * 100}%` }} aria-hidden />
            </li>
          ))}
        </ol>
      )}
      {rest > 0 && <p className="adm-panel-card__empty adm-mono">+{rest} more</p>}
    </section>
  );
}
