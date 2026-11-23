/** Shared pieces for the click stats: periods, day buckets, tallies. */

export const STAT_RANGES = [7, 30, 90] as const;
export type StatRange = (typeof STAT_RANGES)[number];

/** Day buckets follow the owner's clock (Argentina, UTC-3, no DST). */
export const TZ_OFFSET_MS = -3 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

export interface DayCount {
  /** YYYY-MM-DD in the owner's time zone */
  day: string;
  clicks: number;
}

export interface NamedCount {
  name: string;
  clicks: number;
}

export function dayKey(ms: number) {
  return new Date(ms + TZ_OFFSET_MS).toISOString().slice(0, 10);
}

/** Start (UTC ms) of the owner's current day minus `daysBack` days. */
export function startOfDay(now: number, daysBack: number) {
  const local = now + TZ_OFFSET_MS;
  return local - (local % DAY_MS) - TZ_OFFSET_MS - daysBack * DAY_MS;
}

/** Count rows by a key, most first; rows whose key is empty are left out. */
export function tally<T>(rows: T[], key: (row: T) => string | null | undefined): NamedCount[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const name = key(r);
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, clicks]) => ({ name, clicks })).sort((a, b) => b.clicks - a.clicks);
}

/** One day key per day of the range, oldest first, each at 0. */
export function emptyDays(from: number, range: number) {
  const days = new Map<string, number>();
  for (let i = 0; i < range; i++) days.set(dayKey(from + i * DAY_MS), 0);
  return days;
}
