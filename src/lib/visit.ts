import { getCloudflareContext } from '@opennextjs/cloudflare';
import { parseUserAgent } from './user-agent';

/**
 * What a click says about its visitor, read from the request: Cloudflare's geo
 * data, the user agent, the language, and a salted daily visitor hash (counts
 * unique visitors without keeping the IP). Shared by the page's click beacon and
 * the /l/<code> redirect.
 */
export interface VisitDetails {
  country: string | null;
  region: string | null;
  city: string | null;
  device: string;
  browser: string;
  os: string;
  language: string | null;
  visitor: string | null;
  isBot: boolean;
}

/** Lowercase tag for free-text sources and campaigns: ?s=Instagram Story → "instagram-story". */
export function tag(value: string | null | undefined, max = 40): string | null {
  if (!value) return null;
  const clean = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._ -]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, max);
  return clean || null;
}

export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.toLowerCase().replace(/^www\./, '').slice(0, 80) || null;
  } catch {
    return null;
  }
}

function text(value: unknown, max = 80): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

async function visitorHash(ip: string | null, ua: string, secret: string): Promise<string | null> {
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}|${day}|${ip}|${ua}`));
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function describeVisit(request: Request): Promise<VisitDetails> {
  const headers = request.headers;
  const ctx = await getCloudflareContext({ async: true });
  const cf = (ctx.cf ?? {}) as Record<string, unknown>;
  const env = ctx.env as unknown as { ADMIN_PASSWORD_HASH?: string };

  const ua = headers.get('user-agent') ?? '';
  const agent = parseUserAgent(ua);
  const ip = headers.get('cf-connecting-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const country = (text(cf.country, 2) ?? text(headers.get('cf-ipcountry'), 2))?.toUpperCase() ?? null;

  return {
    // XX: unknown
    country: country && country !== 'XX' ? country : null,
    region: text(cf.region),
    city: text(cf.city),
    device: agent.device,
    browser: agent.browser,
    os: agent.os,
    language: tag(headers.get('accept-language')?.split(/[,;-]/)[0], 8),
    visitor: await visitorHash(ip, ua, env.ADMIN_PASSWORD_HASH || 'dev-only-secret'),
    isBot: agent.isBot,
  };
}
