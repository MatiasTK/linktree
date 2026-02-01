import { authService } from '@/services/auth.service';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const { cookieName } = authService.logout();
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
  return NextResponse.json({ success: true });
}
