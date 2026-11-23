import { CopyButton } from '@/components/admin/CopyButton';
import { DailyChart } from '@/components/admin/DailyChart';
import { Change, number, Ranking, SOURCE_NAMES } from '@/components/admin/stats';
import { City, Country, DEVICE_NAMES, languageName } from '@/components/admin/visit-labels';
import { hostOf } from '@/lib/link-icon';
import { validatePositiveInt } from '@/lib/validation';
import { shortLinksService } from '@/services/short-links.service';
import { STAT_RANGES, type StatRange } from '@/lib/stats-time';
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}

const when = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/Argentina/Buenos_Aires',
});

export default async function ShortLinkStatsPage({ params, searchParams }: PageProps) {
  const id = validatePositiveInt((await params).id, -1);
  const { range: rawRange } = await searchParams;
  const range = (STAT_RANGES.find((r) => String(r) === rawRange) ?? 30) as StatRange;
  if (id < 0) notFound();

  const stats = await shortLinksService.getStats(id, range).catch(() => null);
  if (!stats) notFound();
  const { link } = stats;

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const shortUrl = `${proto}://${host}/l/${link.code}`;
  const sourceName = (name: string) => SOURCE_NAMES[name] ?? name;

  return (
    <div className="adm-dash">
      <header className="adm-head">
        <div className="adm-head__title">
          <Link href="/admin/short-links" className="adm-back">
            <ArrowLeft size={16} aria-hidden />
            Short links
          </Link>
          <h1>
            {link.label || `/l/${link.code}`}
            {link.is_active !== 1 && <span className="adm-tag adm-tag--warn">paused</span>}
          </h1>
          <span className="adm-head__meta adm-mono adm-short-head">
            <span>{shortUrl.replace(/^https?:\/\//, '')}</span>
            <span aria-hidden>→</span>
            <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url}>
              {hostOf(link.url)}
              <ExternalLink size={13} aria-hidden />
            </a>
          </span>
        </div>
        <div className="adm-head__actions">
          <CopyButton value={shortUrl} label="Copy" withText />
          <Link href={`/admin/short-links?edit=${link.id}`} className="btn btn-ghost">
            <Pencil size={16} aria-hidden />
            Edit
          </Link>
          <nav className="adm-seg" aria-label="Period">
            {STAT_RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/short-links/${link.id}?range=${r}`}
                className="adm-seg__item"
                aria-current={r === range ? 'true' : undefined}
                scroll={false}
              >
                {r} days
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="adm-dash__body">
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
                {number.format(link.clicks)} all time
              </span>
            </p>
          </div>
          <dl className="adm-facts">
            <div>
              <dt>Visitors</dt>
              <dd className="adm-mono">{number.format(stats.visitors)}</dd>
            </div>
            <div>
              <dt>Clicks per visitor</dt>
              <dd className="adm-mono">{stats.visitors ? (stats.total / stats.visitors).toFixed(1) : '–'}</dd>
            </div>
            <div>
              <dt>Countries</dt>
              <dd className="adm-mono">{stats.countries.filter((c) => c.name !== 'unknown').length}</dd>
            </div>
            <div>
              <dt title="Link previews (WhatsApp, Slack, X…), crawlers and scripts. Not counted as clicks.">Bots filtered</dt>
              <dd className="adm-mono">{number.format(stats.bots)}</dd>
            </div>
          </dl>
          <DailyChart days={stats.daily} />
        </section>

        <div className="adm-dash__pair">
          <Ranking title="Where visitors came from" rows={stats.sources} total={stats.total} label={sourceName} />
          <Ranking
            title="Referring sites"
            rows={stats.referrers}
            total={stats.total}
            empty="No visit in this period sent a referrer. Apps often hide it; tag what you post with ?s=name."
          />
        </div>

        <div className="adm-dash__pair">
          <Ranking title="Countries" rows={stats.countries} total={stats.total} label={(code) => <Country code={code} />} />
          <Ranking title="Cities" rows={stats.cities} total={stats.total} label={(value) => <City value={value} />} />
        </div>

        <div className="adm-dash__pair">
          <Ranking title="Devices" rows={stats.devices} total={stats.total} names={DEVICE_NAMES} />
          <Ranking title="Browsers and apps" rows={stats.browsers} total={stats.total} />
        </div>

        <div className="adm-dash__pair">
          <Ranking title="Operating systems" rows={stats.systems} total={stats.total} />
          <Ranking title="Languages" rows={stats.languages} total={stats.total} label={languageName} />
        </div>

        {stats.campaigns.length > 0 && (
          <div className="adm-dash__pair">
            <Ranking title="Campaigns" rows={stats.campaigns} total={stats.total} />
          </div>
        )}

        <section className="adm-panel-card adm-panel-card--wide" aria-labelledby="recent-title">
          <h2 id="recent-title">Latest clicks</h2>
          {stats.recent.length === 0 ? (
            <p className="adm-panel-card__empty">
              Nobody has followed this link yet. Open <a href={`/l/${link.code}`}>/l/{link.code}</a> from your phone to see
              your first click here.
            </p>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Where</th>
                    <th scope="col">From</th>
                    <th scope="col" className="adm-col-before">
                      Device
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((c, i) => (
                    <tr key={`${c.created_at}-${i}`}>
                      <td className="adm-mono adm-nowrap">{when.format(c.created_at)}</td>
                      <td>
                        {c.city ? <City value={[c.city, '', c.country ?? ''].join('|')} /> : <Country code={c.country ?? 'unknown'} />}
                      </td>
                      <td>
                        {sourceName(c.source)}
                        {c.campaign && <small className="adm-muted adm-mono"> · {c.campaign}</small>}
                      </td>
                      <td className="adm-muted adm-col-before">
                        {[DEVICE_NAMES[c.device ?? ''] ?? c.device, c.browser, c.os].filter(Boolean).join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
