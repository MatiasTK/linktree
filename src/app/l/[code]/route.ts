import { clickSource } from '@/lib/click-source';
import { validateShortCode } from '@/lib/validation';
import { describeVisit, referrerHost, tag } from '@/lib/visit';
import { shortLinksService } from '@/services/short-links.service';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/** ?s=ig and friends: a source tag set by hand wins over the referrer. */
const SOURCE_ALIASES: Record<string, string> = {
  ig: 'instagram',
  fb: 'facebook',
  tw: 'x',
  twitter: 'x',
  li: 'linkedin',
  tt: 'tiktok',
  yt: 'youtube',
  gh: 'github',
  wa: 'whatsapp',
  tg: 'telegram',
  dc: 'discord',
};

// GET /l/[code] - Redirect to the short link's destination and record the visit
export async function GET(request: Request, { params }: RouteParams) {
  const { code: rawCode } = await params;
  const code = validateShortCode(decodeURIComponent(rawCode));
  const link = code ? await shortLinksService.findActiveByCode(code) : null;

  const url = new URL(request.url);
  if (!link) {
    return NextResponse.redirect(new URL('/', url), { status: 302, headers: { 'Cache-Control': 'no-store' } });
  }

  const headers = request.headers;
  const purpose = headers.get('sec-purpose') ?? headers.get('purpose') ?? '';
  const isPrefetch = /prefetch|prerender/i.test(purpose);

  if (request.method === 'GET' && !isPrefetch) {
    const referrer = headers.get('referer');
    const manualSource = tag(url.searchParams.get('s') ?? url.searchParams.get('ref') ?? url.searchParams.get('utm_source'));
    const visit = await describeVisit(request);

    // record after the response: Workers stop once it is sent unless told to wait
    const ctx = await getCloudflareContext({ async: true });
    ctx.ctx.waitUntil(
      shortLinksService.trackVisit(link.id, {
        ...visit,
        source: manualSource
          ? (SOURCE_ALIASES[manualSource] ?? manualSource)
          : clickSource(referrer, headers.get('user-agent'), url.hostname),
        referrerHost: referrerHost(referrer),
        campaign: tag(url.searchParams.get('utm_campaign') ?? url.searchParams.get('c'), 60),
      }),
    );
  }

  return NextResponse.redirect(link.url, {
    status: 302,
    headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' },
  });
}
