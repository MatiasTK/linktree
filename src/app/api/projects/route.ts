import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { apiError, serviceToResponse } from '@/lib/api-response';
import { validateProjectData } from '@/lib/validation';
import { projectsService } from '@/services/projects.service';

// GET /api/projects - All projects, hidden ones included (admin)
export async function GET() {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  return serviceToResponse(await projectsService.findAll());
}

// POST /api/projects - Create a project
export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as Record<string, unknown>;
  const validation = validateProjectData(body);
  if (!validation.success) {
    return apiError(validation.error!, 400);
  }

  return serviceToResponse(await projectsService.create(validation.data!));
}
