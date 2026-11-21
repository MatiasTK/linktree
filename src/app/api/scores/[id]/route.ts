import { apiError, serviceToResponse } from '@/lib/api-response';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { validatePositiveInt } from '@/lib/validation';
import { scoresService } from '@/services/scores.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/scores/[id] - remove a leaderboard entry (admin)
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }
  const id = validatePositiveInt((await params).id, -1);
  if (id < 0) return apiError('Invalid score ID', 400);
  return serviceToResponse(await scoresService.remove(id));
}
