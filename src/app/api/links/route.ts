import { apiError, serviceToResponse } from '@/lib/api-response';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { validateLinkData, validatePositiveInt } from '@/lib/validation';
import { linksService } from '@/services/links.service';

// GET /api/links - Get all links (optionally filtered by section)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sectionIdParam = searchParams.get('sectionId');
  const visibleOnly = searchParams.get('visibleOnly') === 'true';

  const sectionId = sectionIdParam ? validatePositiveInt(sectionIdParam, -1) : undefined;

  const result = await linksService.findAll({
    sectionId: sectionId !== undefined && sectionId >= 0 ? sectionId : undefined,
    visibleOnly,
  });

  return serviceToResponse(result);
}

// POST /api/links - Create a new link
export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as Record<string, unknown>;

  const validation = validateLinkData(body);
  if (!validation.success) {
    return apiError(validation.error!, 400);
  }

  const { section_id, label, url } = validation.data!;
  if (!section_id || !label || !url) {
    return apiError('section_id, label, and url are required', 400);
  }

  const result = await linksService.create({
    section_id,
    label,
    url,
    icon_type: validation.data!.icon_type ?? 'link',
    is_visible: validation.data!.is_visible ?? true,
    display_order: validation.data!.display_order,
  });

  if (result.success) {
    return serviceToResponse({ ...result, data: result.data });
  }

  return serviceToResponse(result);
}
