import { apiSuccess } from '@/lib/api-response';
import { issueStartToken } from '@/lib/typing/token';

export const dynamic = 'force-dynamic';

// GET /api/scores/token - a signed start token the page holds while a test runs
export async function GET() {
  return apiSuccess({ token: await issueStartToken() });
}
