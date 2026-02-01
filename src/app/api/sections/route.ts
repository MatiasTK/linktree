import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { apiError, serviceToResponse } from '@/lib/api-response';
import { validateSectionData } from '@/lib/validation';
import { sectionsService } from '@/services/sections.service';

// GET /api/sections - Get all sections
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mainOnly = searchParams.get('mainOnly') === 'true';

  const result = await sectionsService.findAll({ mainOnly });
  return serviceToResponse(result);
}

// POST /api/sections - Create a new section
export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as Record<string, unknown>;

  const validation = validateSectionData(body);
  if (!validation.success) {
    return apiError(validation.error!, 400);
  }

  const { title, slug } = validation.data!;
  if (!title || !slug) {
    return apiError('Title and slug are required', 400);
  }

  const result = await sectionsService.create({
    title,
    slug,
    show_in_main: validation.data!.show_in_main ?? true,
    display_order: validation.data!.display_order ?? 0,
    description: validation.data!.description ?? null,
    profile_initial: validation.data!.profile_initial ?? null,
    profile_image_url: validation.data!.profile_image_url ?? null,
  });

  if (result.success) {
    return serviceToResponse({ ...result, data: result.data });
  }

  return serviceToResponse(result);
}
