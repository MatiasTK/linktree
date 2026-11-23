import { clickSource } from '@/lib/click-source';
import { describeVisit } from '@/lib/visit';
import { validatePositiveInt } from '@/lib/validation';
import { linksService } from '@/services/links.service';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/links/[id]/click - Track link click
// Body (optional, text/plain from sendBeacon): { "ref": "<the referrer the visit started with>" }
// This endpoint uses fire-and-forget to track clicks asynchronously
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const linkId = validatePositiveInt(id, -1);
  if (linkId < 0) {
    return NextResponse.json({ success: false, error: 'Invalid link ID' }, { status: 400 });
  }

  let ref: string | undefined;
  try {
    const body = JSON.parse((await request.text()) || '{}') as { ref?: unknown };
    if (typeof body.ref === 'string') ref = body.ref.slice(0, 500);
  } catch {
    /* no body or not JSON: count the click without a referrer */
  }

  const source = clickSource(ref, request.headers.get('user-agent'), new URL(request.url).hostname);

  // Use waitUntil to ensure the click tracking completes in the background
  // This is required for Cloudflare Workers which terminate after the response is sent
  const visit = await describeVisit(request);
  // a scripted beacon is not a visitor
  if (visit.isBot) return NextResponse.json({ success: true });

  const ctx = await getCloudflareContext({ async: true });
  ctx.ctx.waitUntil(
    linksService.trackClick(linkId, source, visit).catch((error) => {
      console.error('Error tracking click:', error);
    })
  );

  return NextResponse.json({ success: true });
}
