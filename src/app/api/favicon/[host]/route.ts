// GET /api/favicon/<host> - the site's favicon, proxied and cached at the edge.
// Visitors never request a third party directly. When no icon exists, a plain
// globe is returned so the key still shows something sensible.

interface RouteParams {
  params: Promise<{ host: string }>;
}

const HOST_PATTERN = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const WEEK = 60 * 60 * 24 * 7;

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6e6b64" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;

function fallback() {
  return new Response(FALLBACK_SVG, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': `public, max-age=${60 * 60 * 24}`,
    },
  });
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { host: raw } = await params;
  const host = decodeURIComponent(raw).toLowerCase();
  if (!HOST_PATTERN.test(host)) return fallback();

  try {
    const upstream = await fetch(`https://icons.duckduckgo.com/ip3/${host}.ico`, {
      cf: { cacheTtl: WEEK, cacheEverything: true },
    } as RequestInit);
    const type = upstream.headers.get('content-type') ?? '';
    if (!upstream.ok || !type.startsWith('image/')) return fallback();

    return new Response(upstream.body, {
      headers: {
        'Content-Type': type,
        'Cache-Control': `public, max-age=${WEEK}, stale-while-revalidate=${WEEK}`,
      },
    });
  } catch {
    return fallback();
  }
}
