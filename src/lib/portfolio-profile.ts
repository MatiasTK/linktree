import { defaultProfile, type PortfolioProfile, type T } from '@/content/portfolio';

/**
 * Shape-check and trim a profile coming from the admin or from D1. Anything
 * missing or malformed falls back to the default for that field, so the public
 * page always has something to render.
 */

const MAX = { short: 120, line: 300, body: 1500, list: 30, tags: 20 };

function str(value: unknown, max: number, fallback = ''): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function t(value: unknown, max: number, fallback?: T): T {
  const v = (value ?? {}) as Partial<Record<keyof T, unknown>>;
  return { en: str(v.en, max, fallback?.en ?? ''), es: str(v.es, max, fallback?.es ?? '') };
}

function list<I>(value: unknown, map: (item: unknown) => I | null, fallback: I[]): I[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .slice(0, MAX.list)
    .map(map)
    .filter((i): i is I => i !== null);
}

function url(value: unknown, protocols = ['https:', 'http:']): string | null {
  const raw = str(value, 2000);
  if (!raw) return null;
  try {
    return protocols.includes(new URL(raw).protocol) ? raw : null;
  } catch {
    return null;
  }
}

function words(value: unknown): string[] {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return items
    .map((i) => str(i, 60))
    .filter(Boolean)
    .slice(0, MAX.tags);
}

const hasText = (x: T) => Boolean(x.en || x.es);

export function sanitizeProfile(input: unknown): PortfolioProfile {
  const d = defaultProfile;
  const p = (input ?? {}) as Record<string, unknown>;
  const edu = (p.education ?? {}) as Record<string, unknown>;
  const contact = (p.contact ?? {}) as Record<string, unknown>;
  const email = str(p.email, 200);

  return {
    name: str(p.name, MAX.short) || d.name,
    thesis: t(p.thesis, MAX.line, d.thesis),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : d.email,
    linkedin: url(p.linkedin) ?? d.linkedin,
    github: url(p.github) ?? d.github,
    cvUrl: 'cvUrl' in p ? url(p.cvUrl) : d.cvUrl,
    spec: list(
      p.spec,
      (r) => {
        const row = (r ?? {}) as Record<string, unknown>;
        const label = t(row.label, MAX.short);
        return hasText(label) ? { label, value: t(row.value, MAX.line) } : null;
      },
      d.spec,
    ),
    experience: list(
      p.experience,
      (e) => {
        const x = (e ?? {}) as Record<string, unknown>;
        const company = str(x.company, MAX.short);
        if (!company) return null;
        return {
          company,
          team: t(x.team, MAX.short),
          role: str(x.role, MAX.short),
          period: t(x.period, MAX.short),
          body: t(x.body, MAX.body),
          tags: words(x.tags),
        };
      },
      d.experience,
    ),
    howIWork: list(
      p.howIWork,
      (n) => {
        const x = (n ?? {}) as Record<string, unknown>;
        const title = t(x.title, MAX.short);
        return hasText(title) ? { title, body: t(x.body, MAX.body) } : null;
      },
      d.howIWork,
    ),
    stack: list(
      p.stack,
      (g) => {
        const x = (g ?? {}) as Record<string, unknown>;
        const label = t(x.label, MAX.short);
        return hasText(label) ? { label, items: words(x.items) } : null;
      },
      d.stack,
    ),
    education: { name: t(edu.name, MAX.line, d.education.name), school: t(edu.school, MAX.line, d.education.school) },
    credentials: list(
      p.credentials,
      (c) => {
        const x = (c ?? {}) as Record<string, unknown>;
        const name = str(x.name, MAX.line);
        if (!name) return null;
        return { name, issuer: str(x.issuer, MAX.short), date: t(x.date, MAX.short), url: url(x.url) ?? undefined };
      },
      d.credentials,
    ),
    contact: { title: t(contact.title, MAX.short, d.contact.title), body: t(contact.body, MAX.line, d.contact.body) },
  };
}
