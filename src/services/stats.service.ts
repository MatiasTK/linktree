import { query } from '@/lib/db';
import type { Link, Section } from '@/lib/types';
import { linksService } from './links.service';
import { sectionsService } from './sections.service';

// ============================================================================
// Types
// ============================================================================

export const STAT_RANGES = [7, 30, 90] as const;
export type StatRange = (typeof STAT_RANGES)[number];

/** Day buckets follow the owner's clock (Argentina, UTC-3, no DST). */
const TZ_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DayCount {
  /** YYYY-MM-DD in the owner's time zone */
  day: string;
  clicks: number;
}

export interface LinkTraffic {
  link: Link;
  sectionTitle: string;
  clicks: number;
  previous: number;
}

export interface NamedCount {
  name: string;
  clicks: number;
}

export interface DashboardStats {
  /** false until migration 0008 (click_events) is applied */
  eventsAvailable: boolean;
  range: StatRange;
  total: number;
  previousTotal: number;
  allTimeClicks: number;
  linksCount: number;
  sectionsCount: number;
  daily: DayCount[];
  sections: NamedCount[];
  sources: NamedCount[];
  links: LinkTraffic[];
}

function dayKey(ms: number) {
  return new Date(ms + TZ_OFFSET_MS).toISOString().slice(0, 10);
}

/** Start (UTC ms) of the owner's current day minus `daysBack` days. */
function startOfDay(now: number, daysBack: number) {
  const local = now + TZ_OFFSET_MS;
  return local - (local % DAY_MS) - TZ_OFFSET_MS - daysBack * DAY_MS;
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

    const [sections, links] = await Promise.all([sectionsService.getAll(), linksService.getAll()]);
    const sectionTitle = new Map<number, string>(sections.map((s: Section) => [s.id, s.title]));

    const base: DashboardStats = {
      eventsAvailable: false,
      range,
      total: 0,
      previousTotal: 0,
      allTimeClicks: links.reduce((sum, l) => sum + l.clicks, 0),
      linksCount: links.length,
      sectionsCount: sections.length,
      daily: [],
      sections: [],
      sources: [],
      links: [],
    };

    let events: { link_id: number; section_id: number; source: string; created_at: number }[];
    try {
      events = await query('SELECT link_id, section_id, source, created_at FROM click_events WHERE created_at >= ?', [
        prevFrom,
      ]);
    } catch {
      return base;
    }

    const daily = new Map<string, number>();
    for (let i = 0; i < range; i++) daily.set(dayKey(from + i * DAY_MS), 0);

    const bySection = new Map<number, number>();
    const bySource = new Map<string, number>();
    const byLink = new Map<number, { clicks: number; previous: number }>();
    let total = 0;
    let previousTotal = 0;

    for (const e of events) {
      const current = e.created_at >= from;
      const entry = byLink.get(e.link_id) ?? { clicks: 0, previous: 0 };
      if (current) {
        total++;
        entry.clicks++;
        const key = dayKey(e.created_at);
        daily.set(key, (daily.get(key) ?? 0) + 1);
        bySection.set(e.section_id, (bySection.get(e.section_id) ?? 0) + 1);
        bySource.set(e.source, (bySource.get(e.source) ?? 0) + 1);
      } else {
        previousTotal++;
        entry.previous++;
      }
      byLink.set(e.link_id, entry);
    }

    const sortDesc = (a: NamedCount, b: NamedCount) => b.clicks - a.clicks;

    return {
      ...base,
      eventsAvailable: true,
      total,
      previousTotal,
      daily: [...daily.entries()].map(([day, clicks]) => ({ day, clicks })),
      sections: [...bySection.entries()]
        .map(([id, clicks]) => ({ name: sectionTitle.get(id) ?? 'Deleted section', clicks }))
        .sort(sortDesc),
      sources: [...bySource.entries()].map(([name, clicks]) => ({ name, clicks })).sort(sortDesc),
      links: links
        .map((link) => ({
          link,
          sectionTitle: sectionTitle.get(link.section_id) ?? '',
          clicks: byLink.get(link.id)?.clicks ?? 0,
          previous: byLink.get(link.id)?.previous ?? 0,
        }))
        .filter((row) => row.clicks > 0 || row.previous > 0)
        .sort((a, b) => b.clicks - a.clicks || b.previous - a.previous),
    };
  },
};
