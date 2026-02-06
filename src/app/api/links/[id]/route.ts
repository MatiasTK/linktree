import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { apiError, serviceToResponse } from '@/lib/api-response';
import { validateLinkData, validatePositiveInt } from '@/lib/validation';
import { linksService } from '@/services/links.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/links/[id] - Get a single link
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const linkId = validatePositiveInt(id, -1);

  if (linkId < 0) {
    return apiError('Invalid link ID', 400);
  }

  const result = await linksService.findById(linkId);
  return serviceToResponse(result);
}

// PUT /api/links/[id] - Update a link
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const linkId = validatePositiveInt(id, -1);

  if (linkId < 0) {
    return apiError('Invalid link ID', 400);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const confirmSwap = body.confirmSwap as boolean | undefined;

  const validation = validateLinkData(body);
  if (!validation.success) {
    return apiError(validation.error!, 400);
  }

  const result = await linksService.update(linkId, validation.data!, confirmSwap ?? false);
  return serviceToResponse(result);
}

// DELETE /api/links/[id] - Delete a link
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const linkId = validatePositiveInt(id, -1);

  if (linkId < 0) {
    return apiError('Invalid link ID', 400);
  }

  const result = await linksService.delete(linkId);
  return serviceToResponse(result);
}
