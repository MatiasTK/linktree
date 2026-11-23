import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { apiError, serviceToResponse } from '@/lib/api-response';
import { portfolioProfileService } from '@/services/portfolio-profile.service';

// GET /api/portfolio-profile - the /portfolio profile copy (saved, or the code default)
export async function GET() {
  return serviceToResponse({ success: true, data: await portfolioProfileService.get() });
}

// PUT /api/portfolio-profile - replace the whole profile
export async function PUT(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  return serviceToResponse(await portfolioProfileService.save(body));
}
