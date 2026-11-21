import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { apiError, serviceToResponse } from '@/lib/api-response';
import { validatePositiveInt, validateProjectData } from '@/lib/validation';
import { projectsService } from '@/services/projects.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const projectId = validatePositiveInt((await params).id, -1);
  if (projectId < 0) {
    return apiError('Invalid project ID', 400);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const validation = validateProjectData(body);
  if (!validation.success) {
    return apiError(validation.error!, 400);
  }

  return serviceToResponse(await projectsService.update(projectId, validation.data!));
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const projectId = validatePositiveInt((await params).id, -1);
  if (projectId < 0) {
    return apiError('Invalid project ID', 400);
  }

  return serviceToResponse(await projectsService.delete(projectId));
}
