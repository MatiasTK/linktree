import { authService } from '@/services/auth.service';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface LoginRequest {
  password?: string;
}

function getClientIP(request: NextRequest): string {
  const headersList = request.headers;
  return (
    headersList.get('cf-connecting-ip') ||
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const body = (await request.json()) as LoginRequest;

  const result = await authService.login(body.password ?? '', ip);

  if (!result.success) {
    const headers: Record<string, string> = {};
    if ('retryAfterSeconds' in result) {
      headers['Retry-After'] = String(result.retryAfterSeconds);
    }
    // Cast to error type after checking it's not a success
    const errorResult = result as { success: false; error: string; status: number };
    return NextResponse.json(
      { success: false, error: errorResult.error },
      { status: errorResult.status, headers }
    );
  }

  // Set session cookie
  const config = authService.getSessionConfig();
  const cookieStore = await cookies();
  cookieStore.set(config.cookieName, result.data.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: config.duration,
    path: '/',
  });

  return NextResponse.json({ success: true });
}
