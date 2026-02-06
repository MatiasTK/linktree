import { linksService } from '@/services/links.service';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/links/[id]/click - Track link click
// This endpoint uses fire-and-forget to track clicks asynchronously
export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Use waitUntil to ensure the click tracking completes in the background
  // This is required for Cloudflare Workers which terminate after the response is sent
  const ctx = await getCloudflareContext({ async: true });
  ctx.ctx.waitUntil(
    linksService.trackClick(id).catch((error) => {
      console.error('Error tracking click:', error);
    })
  );

  return NextResponse.json({ success: true });
}
