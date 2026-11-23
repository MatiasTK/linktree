import { apiError, serviceToResponse } from '@/lib/api-response';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { validatePositiveInt, validateShortLinkData } from '@/lib/validation';
import { shortLinksService } from '@/services/short-links.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/short-links/[id] - Update code, destination, name or active state
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const id = validatePositiveInt((await params).id, -1);
  if (id < 0) return apiError('Invalid short link ID', 400);

  const body = (await request.json()) as Record<string, unknown>;
  const validation = validateShortLinkData(body);
  if (!validation.success) return apiError(validation.error!, 400);

  return serviceToResponse(await shortLinksService.update(id, validation.data!));
}

// DELETE /api/short-links/[id] - Delete a short link and its click history
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const id = validatePositiveInt((await params).id, -1);
  if (id < 0) return apiError('Invalid short link ID', 400);

  return serviceToResponse(await shortLinksService.delete(id));
}
