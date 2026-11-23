import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { apiError, serviceToResponse } from '@/lib/api-response';
import { projectsService } from '@/services/projects.service';

// PUT /api/projects/reorder - body: { ids: number[] } in the new order
export async function PUT(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0 || ids.length > 100 || !ids.every((id) => Number.isInteger(id) && (id as number) > 0)) {
    return apiError('ids must be a non-empty list of project IDs', 400);
  }

  return serviceToResponse(await projectsService.reorder(ids as number[]));
}
