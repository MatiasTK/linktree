import { login as authLogin, SESSION_COOKIE_NAME, SESSION_DURATION } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, clearAttempts } from '@/lib/rate-limit';
import type { ServiceResult } from './base.service';

// ============================================================================
// Types
// ============================================================================

export interface LoginResult {
  sessionToken: string;
}

export interface RateLimitedError {
  retryAfterSeconds: number;
}

// ============================================================================
// Auth Service
// ============================================================================

export const authService = {
  /**
   * Attempt to login with password
   * Handles rate limiting and failed attempt tracking
   */
  async login(password: string, ip: string): Promise<ServiceResult<LoginResult> | {
    success: false;
    error: string;
    status: 429;
    retryAfterSeconds: number;
  }> {
    try {
      // Check rate limit
      const rateLimit = await checkRateLimit(ip);

      if (!rateLimit.allowed) {
        return {
          success: false,
          error: `Too many attempts. Try again in ${Math.ceil(rateLimit.retryAfterSeconds! / 60)} minutes.`,
          status: 429,
          retryAfterSeconds: rateLimit.retryAfterSeconds!,
        };
      }

      if (!password || typeof password !== 'string') {
        return { success: false, error: 'Password required', status: 400 };
      }

      const sessionToken = await authLogin(password);

      if (!sessionToken) {
        // Record failed attempt
        await recordFailedAttempt(ip);
        const remaining = rateLimit.remainingAttempts - 1;

        return {
          success: false,
          error: remaining > 0
            ? `Invalid password. ${remaining} attempts remaining.`
            : 'Invalid password. Account temporarily locked.',
          status: 401,
        };
      }

      // Clear failed attempts on successful login
      await clearAttempts(ip);

      return { success: true, data: { sessionToken } };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed', status: 500 };
    }
  },

  /**
   * Logout - clear session cookie
   * Returns the cookie name and empty value for the route to handle
   */
  logout(): { cookieName: string } {
    return { cookieName: SESSION_COOKIE_NAME };
  },

  /**
   * Get session configuration for setting cookies
   */
  getSessionConfig(): {
    cookieName: string;
    duration: number;
  } {
    return {
      cookieName: SESSION_COOKIE_NAME,
      duration: SESSION_DURATION,
    };
  },
};
