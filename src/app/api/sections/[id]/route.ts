import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { apiError, serviceToResponse } from '@/lib/api-response';
import { validatePositiveInt, validateSectionData } from '@/lib/validation';
import { sectionsService } from '@/services/sections.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sections/[id] - Get a single section
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const sectionId = validatePositiveInt(id, -1);

  if (sectionId < 0) {
    return apiError('Invalid section ID', 400);
  }

  const result = await sectionsService.findById(sectionId);
  return serviceToResponse(result);
}

// PUT /api/sections/[id] - Update a section
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const sectionId = validatePositiveInt(id, -1);

  if (sectionId < 0) {
    return apiError('Invalid section ID', 400);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const confirmSwap = body.confirmSwap as boolean | undefined;

  const validation = validateSectionData(body);
  if (!validation.success) {
    return apiError(validation.error!, 400);
  }

  const result = await sectionsService.update(sectionId, validation.data!, confirmSwap ?? false);
  return serviceToResponse(result);
}

// DELETE /api/sections/[id] - Delete a section
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const sectionId = validatePositiveInt(id, -1);

  if (sectionId < 0) {
    return apiError('Invalid section ID', 400);
  }

  const result = await sectionsService.delete(sectionId);
  return serviceToResponse(result);
}
