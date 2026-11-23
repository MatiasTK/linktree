import { LinkIcon } from '@/components/atoms';
import { DailyChart } from '@/components/admin/DailyChart';
import { Change, number, Ranking, SOURCE_NAMES } from '@/components/admin/stats';
import { City, Country, DEVICE_NAMES, languageName } from '@/components/admin/visit-labels';
import type { NamedCount } from '@/lib/stats-time';
import { STAT_RANGES, type StatRange } from '@/lib/stats-time';
import { statsService } from '@/services/stats.service';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

const sum = (rows: NamedCount[]) => rows.reduce((n, r) => n + r.clicks, 0);
const sourceName = (name: string) => SOURCE_NAMES[name] ?? name;

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
              <dl className="adm-facts">
                <div>
                  <dt>Visitors</dt>
                  <dd className="adm-mono">{stats.detailsAvailable ? number.format(stats.visitors) : '–'}</dd>
                </div>
                <div>
                  <dt>On your page</dt>
                  <dd className="adm-mono">{number.format(stats.pageClicks)}</dd>
                </div>
                <div>
                  <dt>Via short links</dt>
                  <dd className="adm-mono">{stats.shortLinksAvailable ? number.format(stats.shortClicks) : '–'}</dd>
                </div>
                <div>
                  <dt>Countries</dt>
                  <dd className="adm-mono">{stats.detailsAvailable ? stats.countries.length : '–'}</dd>
                </div>
              </dl>
              <DailyChart days={stats.daily} />
            </section>

            {(!stats.shortLinksAvailable || !stats.detailsAvailable) && (
              <div className="adm-panel-card adm-panel-card--wide">
                <h2>Country, device and short link stats need {stats.shortLinksAvailable ? 'one migration' : 'two migrations'}</h2>
                <p className="adm-panel-card__empty">Apply them once; details are recorded from that moment on.</p>
                {!stats.shortLinksAvailable && (
                  <code className="adm-code">npx wrangler d1 execute linktree-db --file=./migrations/0009_short_links.sql</code>
                )}
                <code className="adm-code">npx wrangler d1 execute linktree-db --file=./migrations/0010_link_short_links.sql</code>
              </div>
            )}

            <div className="adm-dash__pair">
              <Ranking title="By section" rows={stats.sections} total={stats.total} />
              <Ranking title="Where visitors came from" rows={stats.sources} total={stats.total} label={sourceName} />
            </div>

            {stats.detailsAvailable && (
              <>
                <div className="adm-dash__pair">
                  <Ranking title="Countries" rows={stats.countries} total={sum(stats.countries)} label={(code) => <Country code={code} />} />
                  <Ranking title="Cities" rows={stats.cities} total={sum(stats.cities)} label={(value) => <City value={value} />} />
                </div>
                <div className="adm-dash__pair">
                  <Ranking title="Devices" rows={stats.devices} total={sum(stats.devices)} names={DEVICE_NAMES} />
                  <Ranking title="Browsers and apps" rows={stats.browsers} total={sum(stats.browsers)} />
                </div>
                <div className="adm-dash__pair">
                  <Ranking title="Operating systems" rows={stats.systems} total={sum(stats.systems)} />
                  <Ranking title="Languages" rows={stats.languages} total={sum(stats.languages)} label={languageName} />
                </div>
              </>
            )}

            {stats.shortLinksAvailable && (
              <div className="adm-dash__pair">
                <Ranking
                  title="Short links"
                  rows={stats.shortLinks}
                  total={stats.shortClicks}
                  empty="No short link visits in this period."
                  label={(code) => <span className="adm-mono">{code}</span>}
                />
              </div>
            )}

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
                        <th scope="col" className="adm-num adm-col-before" title="Of those clicks, the ones through its short link">
                          Short link
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
                      {stats.links.map(({ link, sectionTitle, clicks, previous, viaShort }) => (
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
                          <td className="adm-num adm-mono adm-muted adm-col-before">{viaShort ? number.format(viaShort) : '–'}</td>
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
