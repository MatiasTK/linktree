import { execute, query, queryFirst } from '@/lib/db';
import type { ShortLink } from '@/lib/types';
import { type ServiceResult, boolToInt } from './base.service';
import { DAY_MS, dayKey, startOfDay, tally, type DayCount, type NamedCount, type StatRange } from '@/lib/stats-time';
import type { VisitDetails } from '@/lib/visit';

// ============================================================================
// Types
// ============================================================================

export interface ShortLinkInput {
  code?: string;
  url?: string;
  label?: string;
  is_active?: boolean;
}

/** One visit to /l/<code>, as recorded by the redirect route. */
export interface ShortLinkVisit extends VisitDetails {
  source: string;
  referrerHost: string | null;
  campaign: string | null;
}

export interface ShortLinkRow extends ShortLink {
  /** human clicks in the last 7 days, today included */
  week: number;
  /** epoch ms of the latest human click */
  last_click: number | null;
  /** name of the page link it belongs to, if any */
  link_label: string | null;
}

export interface RecentClick {
  created_at: number;
  source: string;
  referrer_host: string | null;
  campaign: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
}

export interface ShortLinkStats {
  link: ShortLink;
  range: StatRange;
  total: number;
  previousTotal: number;
  /** unique visitors, counted per day (see migration 0009) */
  visitors: number;
  /** bot and link-preview requests in the period, not counted as clicks */
  bots: number;
  daily: DayCount[];
  sources: NamedCount[];
  referrers: NamedCount[];
  campaigns: NamedCount[];
  countries: NamedCount[];
  cities: NamedCount[];
  devices: NamedCount[];
  browsers: NamedCount[];
  systems: NamedCount[];
  languages: NamedCount[];
  recent: RecentClick[];
}

interface ClickRow {
  created_at: number;
  source: string;
  referrer_host: string | null;
  campaign: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  language: string | null;
  visitor: string | null;
  is_bot: number;
}

// no 0/o, 1/l/i: codes get read aloud and typed from screenshots
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

function randomCode(length = 5) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

const isUniqueError = (error: unknown) => error instanceof Error && /UNIQUE/i.test(error.message);

// ============================================================================
// Short Links Service
// ============================================================================

export const shortLinksService = {
  /** All short links, newest first, with their last-7-days count. */
  async list(): Promise<ServiceResult<ShortLinkRow[]>> {
    try {
      const weekFrom = startOfDay(Date.now(), 6);
      const rows = await query<ShortLinkRow>(
        `SELECT s.*, l.label AS link_label,
           (SELECT COUNT(*) FROM short_link_clicks c WHERE c.short_link_id = s.id AND c.is_bot = 0 AND c.created_at >= ?) AS week,
           (SELECT MAX(created_at) FROM short_link_clicks c WHERE c.short_link_id = s.id AND c.is_bot = 0) AS last_click
         FROM short_links s LEFT JOIN links l ON l.id = s.link_id
         ORDER BY s.link_id IS NOT NULL, s.created_at DESC, s.id DESC`,
        [weekFrom],
      );
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error fetching short links:', error);
      return { success: false, error: 'Failed to fetch short links. Are migrations 0009 and 0010 applied?', status: 500 };
    }
  },

  async findById(id: number): Promise<ShortLink | null> {
    try {
      return await queryFirst<ShortLink>('SELECT * FROM short_links WHERE id = ?', [id]);
    } catch {
      return null;
    }
  },

  /** Used by the redirect: only active links resolve. */
  async findActiveByCode(code: string): Promise<Pick<ShortLink, 'id' | 'url'> | null> {
    try {
      return await queryFirst<Pick<ShortLink, 'id' | 'url'>>(
        'SELECT id, url FROM short_links WHERE code = ? AND is_active = 1',
        [code],
      );
    } catch (error) {
      console.error('Error resolving short link:', error);
      return null;
    }
  },

  async create(data: ShortLinkInput): Promise<ServiceResult<ShortLink>> {
    if (!data.url) return { success: false, error: 'Add the address the short link opens.', status: 400 };
    try {
      // a chosen code must be free; a generated one retries on the rare collision
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = data.code ?? randomCode(attempt < 3 ? 5 : 7);
        try {
          const result = await execute('INSERT INTO short_links (code, url, label, is_active) VALUES (?, ?, ?, ?)', [
            code,
            data.url,
            data.label ?? '',
            boolToInt(data.is_active ?? true),
          ]);
          const created = await queryFirst<ShortLink>('SELECT * FROM short_links WHERE id = ?', [result.meta.last_row_id]);
          return { success: true, data: created! };
        } catch (error) {
          if (!isUniqueError(error)) throw error;
          if (data.code) return { success: false, error: `/l/${data.code} is already taken. Pick another code.`, status: 409 };
        }
      }
      return { success: false, error: 'Could not find a free code. Try again or choose one.', status: 500 };
    } catch (error) {
      console.error('Error creating short link:', error);
      return { success: false, error: 'Failed to create the short link. Is migration 0009 applied?', status: 500 };
    }
  },

  async update(id: number, data: ShortLinkInput, opts: { fromLink?: boolean } = {}): Promise<ServiceResult<ShortLink>> {
    try {
      const existing = await queryFirst<ShortLink>('SELECT * FROM short_links WHERE id = ?', [id]);
      if (!existing) return { success: false, error: 'Short link not found', status: 404 };
      if (!opts.fromLink && existing.link_id !== null && data.url !== undefined && data.url !== existing.url) {
        return { success: false, error: 'This short link follows a page link. Change the address in Links.', status: 400 };
      }

      const fields: [string, unknown][] = [
        ['code', data.code],
        ['url', data.url],
        ['label', data.label],
        ['is_active', data.is_active === undefined ? undefined : boolToInt(data.is_active)],
      ];
      const present = fields.filter(([, value]) => value !== undefined);
      const sets = present.map(([column]) => `${column} = ?`);
      const params = present.map(([, value]) => value);
      if (sets.length === 0) return { success: false, error: 'No fields to update', status: 400 };

      try {
        const result = await execute(`UPDATE short_links SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
          ...params,
          id,
        ]);
        if (result.meta.changes === 0) return { success: false, error: 'Short link not found', status: 404 };
      } catch (error) {
        if (isUniqueError(error)) return { success: false, error: `/l/${data.code} is already taken. Pick another code.`, status: 409 };
        throw error;
      }

      const updated = await queryFirst<ShortLink>('SELECT * FROM short_links WHERE id = ?', [id]);
      return { success: true, data: updated! };
    } catch (error) {
      console.error('Error updating short link:', error);
      return { success: false, error: 'Failed to update the short link', status: 500 };
    }
  },

  async delete(id: number): Promise<ServiceResult<{ deleted: boolean }>> {
    try {
      await execute('DELETE FROM short_link_clicks WHERE short_link_id = ?', [id]);
      const result = await execute('DELETE FROM short_links WHERE id = ?', [id]);
      if (result.meta.changes === 0) return { success: false, error: 'Short link not found', status: 404 };
      return { success: true, data: { deleted: true } };
    } catch (error) {
      console.error('Error deleting short link:', error);
      return { success: false, error: 'Failed to delete the short link', status: 500 };
    }
  },

  // --------------------------------------------------------------------------
  // Page links: each one has its own short link unless turned off
  // --------------------------------------------------------------------------

  async findByLink(linkId: number): Promise<ShortLink | null> {
    try {
      return await queryFirst<ShortLink>('SELECT * FROM short_links WHERE link_id = ?', [linkId]);
    } catch {
      return null; // migration 0010 not applied
    }
  },

  /** true when the code is used by a short link other than `exceptId` */
  async isCodeTaken(code: string, exceptId?: number): Promise<boolean> {
    const row = await queryFirst<{ id: number }>('SELECT id FROM short_links WHERE code = ?', [code]);
    return row !== null && row.id !== exceptId;
  },

  /**
   * Make a page link's short link match the request: create it, change its code,
   * remove it, and keep its destination and name on the link's. Only http(s) links get one.
   */
  async syncForLink(
    link: { id: number; url: string; label: string },
    wanted: { enabled?: boolean; code?: string | null },
  ): Promise<ServiceResult<ShortLink | null>> {
    const existing = await this.findByLink(link.id);
    const linkable = /^https?:/i.test(link.url);

    if (wanted.enabled === false || (!linkable && existing)) {
      if (existing) await this.delete(existing.id);
      return { success: true, data: null };
    }

    if (!existing) {
      if (!wanted.enabled || !linkable) return { success: true, data: null };
      const created = await this.create({ code: wanted.code || undefined, url: link.url, label: link.label });
      if (!created.success) return created;
      await execute('UPDATE short_links SET link_id = ? WHERE id = ?', [link.id, created.data.id]);
      return { success: true, data: { ...created.data, link_id: link.id } };
    }

    const patch: ShortLinkInput = {};
    if (wanted.code && wanted.code !== existing.code) patch.code = wanted.code;
    if (link.url !== existing.url) patch.url = link.url;
    if (link.label !== existing.label) patch.label = link.label;
    if (Object.keys(patch).length === 0) return { success: true, data: existing };
    return this.update(existing.id, patch, { fromLink: true });
  },

  /** The link is going away: its short link keeps working, as a standalone one. */
  async detachLink(linkId: number): Promise<void> {
    try {
      await execute('UPDATE short_links SET link_id = NULL WHERE link_id = ?', [linkId]);
    } catch {
      /* migration 0010 not applied */
    }
  },

  /** Record one visit (fire-and-forget from the redirect). Bots are stored but not counted. */
  async trackVisit(id: number, visit: ShortLinkVisit): Promise<void> {
    try {
      await execute(
        `INSERT INTO short_link_clicks
           (short_link_id, created_at, source, referrer_host, campaign, country, region, city, device, browser, os, language, visitor, is_bot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          Date.now(),
          visit.source,
          visit.referrerHost,
          visit.campaign,
          visit.country,
          visit.region,
          visit.city,
          visit.device,
          visit.browser,
          visit.os,
          visit.language,
          visit.visitor,
          boolToInt(visit.isBot),
        ],
      );
      if (!visit.isBot) await execute('UPDATE short_links SET clicks = clicks + 1 WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error tracking short link visit:', error);
    }
  },

  async getStats(id: number, range: StatRange): Promise<ShortLinkStats | null> {
    const link = await this.findById(id);
    if (!link) return null;

    const now = Date.now();
    const from = startOfDay(now, range - 1);
    const prevFrom = from - range * DAY_MS;

    const [rows, recent] = await Promise.all([
      query<ClickRow>(
        `SELECT created_at, source, referrer_host, campaign, country, region, city, device, browser, os, language, visitor, is_bot
         FROM short_link_clicks WHERE short_link_id = ? AND created_at >= ?`,
        [id, prevFrom],
      ),
      query<RecentClick>(
        `SELECT created_at, source, referrer_host, campaign, country, city, device, browser, os
         FROM short_link_clicks WHERE short_link_id = ? AND is_bot = 0 ORDER BY created_at DESC LIMIT 25`,
        [id],
      ),
    ]);

    const current: ClickRow[] = [];
    let previousTotal = 0;
    let bots = 0;
    for (const r of rows) {
      if (r.created_at < from) {
        if (!r.is_bot) previousTotal++;
      } else if (r.is_bot) {
        bots++;
      } else {
        current.push(r);
      }
    }

    const daily = new Map<string, number>();
    for (let i = 0; i < range; i++) daily.set(dayKey(from + i * DAY_MS), 0);
    for (const r of current) {
      const key = dayKey(r.created_at);
      daily.set(key, (daily.get(key) ?? 0) + 1);
    }

    const visitors = new Set(current.map((r) => r.visitor ?? `anon-${r.created_at}`)).size;

    return {
      link,
      range,
      total: current.length,
      previousTotal,
      visitors,
      bots,
      daily: [...daily.entries()].map(([day, clicks]) => ({ day, clicks })),
      sources: tally(current, (r) => r.source),
      referrers: tally(current, (r) => r.referrer_host),
      campaigns: tally(current, (r) => r.campaign),
      countries: tally(current, (r) => r.country ?? 'unknown'),
      cities: tally(current, (r) => (r.city ? [r.city, r.region, r.country].filter(Boolean).join('|') : null)),
      devices: tally(current, (r) => r.device),
      browsers: tally(current, (r) => r.browser),
      systems: tally(current, (r) => r.os),
      languages: tally(current, (r) => r.language),
      recent,
    };
  },
};
