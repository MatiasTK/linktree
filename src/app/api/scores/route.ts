import { apiError, serviceToResponse } from '@/lib/api-response';
import { parseBoard, scoresService } from '@/services/scores.service';
import { NextRequest } from 'next/server';

function clientIp(request: NextRequest): string {
  const h = request.headers;
  return h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

// GET /api/scores?mode=time&value=30&lang=en - top scores for one board (public)
export async function GET(request: NextRequest) {
  const board = parseBoard(request.nextUrl.searchParams);
  if (!board) return apiError('Unknown test type', 400);
  return serviceToResponse(await scoresService.top(board));
}

// POST /api/scores - submit a finished test (public, rate limited, needs a start token)
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object') return apiError('Invalid body', 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return apiError('Invalid body', 400);
  }
  return serviceToResponse(await scoresService.submit(body, clientIp(request)));
}
