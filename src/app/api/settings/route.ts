import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { apiError, serviceToResponse } from '@/lib/api-response';
import { validateSettingsData } from '@/lib/validation';
import { settingsService } from '@/services/settings.service';

// GET /api/settings - Get all settings
export async function GET() {
  const result = await settingsService.getAll();
  return serviceToResponse(result);
}

// PUT /api/settings - Update settings
export async function PUT(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as Record<string, unknown>;

  const validation = validateSettingsData(body);
  if (!validation.success) {
    return apiError(validation.error!, 400);
  }

  const result = await settingsService.update(validation.data!);
  return serviceToResponse(result);
}
