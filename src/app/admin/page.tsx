import { LinkIcon } from '@/components/atoms';
import { DailyChart } from '@/components/admin/DailyChart';
import { STAT_RANGES, statsService, type NamedCount, type StatRange } from '@/services/stats.service';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

const number = new Intl.NumberFormat('en');

const SOURCE_NAMES: Record<string, string> = {
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
};

function change(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { label: 'new', dir: 'up' as const } : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { label: '±0%', dir: 'flat' as const };
  return { label: `${pct > 0 ? '+' : ''}${pct}%`, dir: pct > 0 ? ('up' as const) : ('down' as const) };
}

function Change({ current, previous }: { current: number; previous: number }) {
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

function Ranking({ title, rows, total, names }: { title: string; rows: NamedCount[]; total: number; names?: Record<string, string> }) {
  const max = Math.max(1, ...rows.map((r) => r.clicks));
  return (
    <section className="adm-panel-card" aria-labelledby={`rank-${title}`}>
      <h2 id={`rank-${title}`}>{title}</h2>
      {rows.length === 0 ? (
        <p className="adm-panel-card__empty">Nothing yet in this period.</p>
      ) : (
        <ol className="adm-rank">
          {rows.slice(0, 8).map((row) => (
            <li key={row.name}>
              <span className="adm-rank__name">{names?.[row.name] ?? row.name}</span>
              <span className="adm-rank__value adm-mono">
                {number.format(row.clicks)}
                <small>{Math.round((row.clicks / Math.max(1, total)) * 100)}%</small>
              </span>
              <span className="adm-rank__bar" style={{ width: `${(row.clicks / max) * 100}%` }} aria-hidden />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { range: rawRange } = await searchParams;
  const range = (STAT_RANGES.find((r) => String(r) === rawRange) ?? 30) as StatRange;
  const stats = await statsService.getDashboardStats(range);

  return (
    <div className="adm-dash">
      <header className="adm-head">
        <div className="adm-head__title">
          <h1>Dashboard</h1>
          <span className="adm-head__meta adm-mono">
            {stats.sectionsCount} sections · {stats.linksCount} links
          </span>
        </div>
        <nav className="adm-seg" aria-label="Period">
          {STAT_RANGES.map((r) => (
            <Link key={r} href={`/admin?range=${r}`} className="adm-seg__item" aria-current={r === range ? 'true' : undefined} scroll={false}>
              {r} days
            </Link>
          ))}
        </nav>
      </header>

      <div className="adm-dash__body">
        {!stats.eventsAvailable ? (
          <div className="adm-empty">
            <h2>Daily stats need one migration</h2>
            <p>
              Clicks are still counted per link, but the per-day, per-section and per-source history lives in a new table.
              Apply it once and tracking starts from that moment:
            </p>
            <code className="adm-code">npx wrangler d1 execute linktree-db --file=./migrations/0008_admin_redesign.sql</code>
          </div>
        ) : (
          <>
            <section className="adm-panel-card adm-panel-card--wide" aria-labelledby="daily-title">
              <div className="adm-panel-card__head">
                <h2 id="daily-title">Clicks per day</h2>
                <p className="adm-summary adm-mono">
                  <strong>{number.format(stats.total)}</strong> in {range} days{' '}
                  {(stats.previousTotal > 0 || stats.total > 0) && (
                    <>
                      <Change current={stats.total} previous={stats.previousTotal} /> vs the {range} before
                    </>
                  )}
                  <span className="adm-summary__alltime">
                    <span className="adm-summary__sep" aria-hidden>
                      ·{' '}
                    </span>
                    {number.format(stats.allTimeClicks)} all time
                  </span>
                </p>
              </div>
              <DailyChart days={stats.daily} />
            </section>

            <div className="adm-dash__pair">
              <Ranking title="By section" rows={stats.sections} total={stats.total} />
              <Ranking title="Where visitors came from" rows={stats.sources} total={stats.total} names={SOURCE_NAMES} />
            </div>

            <section className="adm-panel-card adm-panel-card--wide" aria-labelledby="links-title">
              <h2 id="links-title">Links</h2>
              {stats.links.length === 0 ? (
                <p className="adm-panel-card__empty">
                  No link has been clicked in the last {range} days. Daily tracking started with this version of the admin;
                  all-time counts are on <Link href="/admin/links">each link</Link>.
                </p>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th scope="col">Link</th>
                        <th scope="col" className="adm-num">
                          Clicks
                        </th>
                        <th scope="col" className="adm-num adm-col-before">
                          Before
                        </th>
                        <th scope="col" className="adm-num">
                          Change
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.links.map(({ link, sectionTitle, clicks, previous }) => (
                        <tr key={link.id}>
                          <td>
                            <span className="adm-table__link">
                              <span className="adm-link__icon" aria-hidden>
                                <LinkIcon iconType={link.icon_type} url={link.url} size={16} />
                              </span>
                              <span>
                                <strong>{link.label}</strong>
                                <small>{sectionTitle}</small>
                              </span>
                            </span>
                          </td>
                          <td className="adm-num adm-mono">{number.format(clicks)}</td>
                          <td className="adm-num adm-mono adm-muted adm-col-before">{number.format(previous)}</td>
                          <td className="adm-num">
                            <Change current={clicks} previous={previous} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
