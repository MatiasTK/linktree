import { query } from '@/lib/db';
import { DAY_MS, dayKey, emptyDays, startOfDay, tally, type DayCount, type NamedCount, type StatRange } from '@/lib/stats-time';
import type { Link, Section } from '@/lib/types';
import { linksService } from './links.service';
import { sectionsService } from './sections.service';

// ============================================================================
// Types
// ============================================================================

export { STAT_RANGES } from '@/lib/stats-time';
export type { DayCount, NamedCount, StatRange } from '@/lib/stats-time';

export interface LinkTraffic {
  link: Link;
  sectionTitle: string;
  /** page clicks + visits through its short link */
  clicks: number;
  previous: number;
  /** of `clicks`, the ones through its short link */
  viaShort: number;
}

export interface DashboardStats {
  /** false until migration 0008 (click_events) is applied */
  eventsAvailable: boolean;
  /** false until migration 0009 (short links) is applied */
  shortLinksAvailable: boolean;
  /** false until migration 0010 (visit details on page clicks) is applied */
  detailsAvailable: boolean;
  range: StatRange;
  /** page clicks + short link visits in the period */
  total: number;
  previousTotal: number;
  pageClicks: number;
  shortClicks: number;
  /** unique visitors, counted per day */
  visitors: number;
  allTimeClicks: number;
  linksCount: number;
  sectionsCount: number;
  daily: DayCount[];
  sections: NamedCount[];
  sources: NamedCount[];
  countries: NamedCount[];
  cities: NamedCount[];
  devices: NamedCount[];
  browsers: NamedCount[];
  systems: NamedCount[];
  languages: NamedCount[];
  /** short links by visits, as /l/<code> */
  shortLinks: NamedCount[];
  links: LinkTraffic[];
}

/** One click from either channel, in a common shape. */
interface Click {
  channel: 'page' | 'short';
  created_at: number;
  link_id: number | null;
  section_id: number | null;
  short_code: string | null;
  source: string;
  country: string | null;
  region: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  language: string | null;
  visitor: string | null;
}

const DETAIL_COLUMNS = 'country, region, city, device, browser, os, language, visitor';

/** Page clicks since `from`; with visit details once migration 0010 is in. null: no click_events table. */
async function pageClicks(from: number): Promise<{ rows: Click[]; details: boolean } | null> {
  type Row = Omit<Click, 'channel' | 'short_code'>;
  try {
    const rows = await query<Row>(
      `SELECT link_id, section_id, source, created_at, ${DETAIL_COLUMNS} FROM click_events WHERE created_at >= ?`,
      [from],
    );
    return { rows: rows.map((r) => ({ ...r, channel: 'page', short_code: null })), details: true };
  } catch {
    try {
      const rows = await query<Pick<Row, 'link_id' | 'section_id' | 'source' | 'created_at'>>(
        'SELECT link_id, section_id, source, created_at FROM click_events WHERE created_at >= ?',
        [from],
      );
      const blank = { country: null, region: null, city: null, device: null, browser: null, os: null, language: null, visitor: null };
      return { rows: rows.map((r) => ({ ...r, ...blank, channel: 'page', short_code: null })), details: false };
    } catch {
      return null;
    }
  }
}

/** Human short link visits since `from`. null: no short link tables. */
async function shortClicks(from: number): Promise<Click[] | null> {
  type Row = Omit<Click, 'channel' | 'section_id'>;
  const sql = (linkColumn: string) =>
    `SELECT c.created_at, c.source, ${DETAIL_COLUMNS.split(', ').map((c) => `c.${c}`).join(', ')},
       s.code AS short_code, ${linkColumn} AS link_id
     FROM short_link_clicks c JOIN short_links s ON s.id = c.short_link_id
     WHERE c.is_bot = 0 AND c.created_at >= ?`;
  let rows: Row[];
  try {
    rows = await query<Row>(sql('s.link_id'), [from]);
  } catch {
    try {
      rows = await query<Row>(sql('NULL'), [from]); // before migration 0010
    } catch {
      return null;
    }
  }
  return rows.map((r) => ({ ...r, channel: 'short', section_id: null }));
}

// ============================================================================
// Stats Service
// ============================================================================

export const statsService = {
  async getDashboardStats(range: StatRange): Promise<DashboardStats> {
    const now = Date.now();
    // the current day counts as one of the range's days
    const from = startOfDay(now, range - 1);
    const prevFrom = from - range * DAY_MS;

    const [sections, links, page, short] = await Promise.all([
      sectionsService.getAll(),
      linksService.getAll(),
      pageClicks(prevFrom),
      shortClicks(prevFrom),
    ]);
    const sectionTitle = new Map<number, string>(sections.map((s: Section) => [s.id, s.title]));
    const linkSection = new Map<number, number>(links.map((l) => [l.id, l.section_id]));

    const base: DashboardStats = {
      eventsAvailable: page !== null,
      shortLinksAvailable: short !== null,
      detailsAvailable: page?.details ?? false,
      range,
      total: 0,
      previousTotal: 0,
      pageClicks: 0,
      shortClicks: 0,
      visitors: 0,
      allTimeClicks: links.reduce((sum, l) => sum + l.clicks, 0),
      linksCount: links.length,
      sectionsCount: sections.length,
      daily: [],
      sections: [],
      sources: [],
      countries: [],
      cities: [],
      devices: [],
      browsers: [],
      systems: [],
      languages: [],
      shortLinks: [],
      links: [],
    };
    if (!page) return base;

    // a short link of a page link counts for that link's section
    const all = [...page.rows, ...(short ?? [])].map((c) =>
      c.section_id === null && c.link_id !== null ? { ...c, section_id: linkSection.get(c.link_id) ?? null } : c,
    );

    const current: Click[] = [];
    const byLink = new Map<number, { clicks: number; previous: number; viaShort: number }>();
    let previousTotal = 0;
    for (const c of all) {
      const isCurrent = c.created_at >= from;
      if (isCurrent) current.push(c);
      else previousTotal++;
      if (c.link_id === null) continue;
      const entry = byLink.get(c.link_id) ?? { clicks: 0, previous: 0, viaShort: 0 };
      if (isCurrent) {
        entry.clicks++;
        if (c.channel === 'short') entry.viaShort++;
      } else {
        entry.previous++;
      }
      byLink.set(c.link_id, entry);
    }

    const daily = emptyDays(from, range);
    for (const c of current) {
      const key = dayKey(c.created_at);
      daily.set(key, (daily.get(key) ?? 0) + 1);
    }

    const withVisitor = current.filter((c) => c.visitor);

    return {
      ...base,
      total: current.length,
      previousTotal,
      pageClicks: current.filter((c) => c.channel === 'page').length,
      shortClicks: current.filter((c) => c.channel === 'short').length,
      visitors: new Set(withVisitor.map((c) => c.visitor)).size,
      // all-time: page counters + short link counters
      allTimeClicks: base.allTimeClicks + (await shortLinkTotal()),
      daily: [...daily.entries()].map(([day, clicks]) => ({ day, clicks })),
      sections: tally(current, (c) => (c.section_id === null ? null : (sectionTitle.get(c.section_id) ?? 'Deleted section'))),
      sources: tally(current, (c) => c.source),
      countries: tally(current, (c) => c.country),
      cities: tally(current, (c) => (c.city ? [c.city, c.region, c.country].filter(Boolean).join('|') : null)),
      devices: tally(current, (c) => c.device),
      browsers: tally(current, (c) => c.browser),
      systems: tally(current, (c) => c.os),
      languages: tally(current, (c) => c.language),
      shortLinks: tally(current, (c) => (c.short_code ? `/l/${c.short_code}` : null)),
      links: links
        .map((link) => ({
          link,
          sectionTitle: sectionTitle.get(link.section_id) ?? '',
          clicks: byLink.get(link.id)?.clicks ?? 0,
          previous: byLink.get(link.id)?.previous ?? 0,
          viaShort: byLink.get(link.id)?.viaShort ?? 0,
        }))
        .filter((row) => row.clicks > 0 || row.previous > 0)
        .sort((a, b) => b.clicks - a.clicks || b.previous - a.previous),
    };
  },
};

async function shortLinkTotal(): Promise<number> {
  try {
    const row = await query<{ total: number }>('SELECT COALESCE(SUM(clicks), 0) AS total FROM short_links');
    return row[0]?.total ?? 0;
  } catch {
    return 0;
  }
}
