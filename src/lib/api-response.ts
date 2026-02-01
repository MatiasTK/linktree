import { NextResponse } from 'next/server';
import type { ServiceResult } from '@/services/base.service';

/**
 * Convert a ServiceResult to a NextResponse
 */
export function serviceToResponse<T>(result: ServiceResult<T>): NextResponse {
  if (result.success) {
    return NextResponse.json({ success: true, data: result.data });
  }

  if ('warning' in result && result.warning) {
    return NextResponse.json({
      success: false,
      warning: true,
      message: result.message,
      conflictWith: result.conflictWith,
      currentOrder: result.currentOrder,
    });
  }

  // TypeScript now knows this is the error case (not warning)
  const errorResult = result as { success: false; error: string; status: number };
  return NextResponse.json(
    { success: false, error: errorResult.error },
    { status: errorResult.status }
  );
}

/**
 * Create a success response
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error response
 */
export function apiError(error: string, status: number = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}
