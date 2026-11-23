import { apiError, serviceToResponse } from '@/lib/api-response';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { validateShortLinkData } from '@/lib/validation';
import { shortLinksService } from '@/services/short-links.service';

// GET /api/short-links - List short links (owner only: destinations can be private)
export async function GET() {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }
  return serviceToResponse(await shortLinksService.list());
}

// POST /api/short-links - Create a short link; the code is generated when left empty
export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as Record<string, unknown>;
  const validation = validateShortLinkData(body);
  if (!validation.success) return apiError(validation.error!, 400);
  if (!validation.data!.url) return apiError('Add the address the short link opens.', 400);

  return serviceToResponse(await shortLinksService.create(validation.data!));
}
