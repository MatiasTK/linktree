import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { apiError, serviceToResponse } from '@/lib/api-response';
import { sectionsService } from '@/services/sections.service';

// PUT /api/sections/reorder - body: { ids: number[] } in the new order
export async function PUT(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0 || ids.length > 200 || !ids.every((id) => Number.isInteger(id) && (id as number) > 0)) {
    return apiError('ids must be a non-empty list of section IDs', 400);
  }

  return serviceToResponse(await sectionsService.reorder(ids as number[]));
}
