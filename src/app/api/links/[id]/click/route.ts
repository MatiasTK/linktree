import { linksService } from '@/services/links.service';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/links/[id]/click - Track link click
// This endpoint uses fire-and-forget to track clicks asynchronously
export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Fire-and-forget: increment click counter without blocking
  linksService.trackClick(id).catch((error) => {
    console.error('Error tracking click:', error);
  });

  return NextResponse.json({ success: true });
}
