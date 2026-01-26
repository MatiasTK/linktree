import { getDB } from "./db";

const MAX_ATTEMPTS = 5; // Max attempts allowed
const WINDOW_MINUTES = 15; // Time window in minutes
const LOCKOUT_MINUTES = 30; // Lockout duration after max attempts

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

/**
 * Check if a login attempt is allowed based on IP
 * Uses D1 to persist rate limit data
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const db = await getDB();
  const now = Date.now();
  const windowStart = now - WINDOW_MINUTES * 60 * 1000;

  // Clean up old entries first (older than lockout period)
  const cleanupTime = now - LOCKOUT_MINUTES * 60 * 1000;
  await db
    .prepare("DELETE FROM login_attempts WHERE timestamp < ?")
    .bind(cleanupTime)
    .run();

  // Count recent attempts
  const result = await db
    .prepare(
      "SELECT COUNT(*) as count, MAX(timestamp) as last_attempt FROM login_attempts WHERE ip = ? AND timestamp > ?"
    )
    .bind(ip, windowStart)
    .first<{ count: number; last_attempt: number | null }>();

  const attemptCount = result?.count || 0;
  const lastAttempt = result?.last_attempt || 0;

  // Check if locked out
  if (attemptCount >= MAX_ATTEMPTS) {
    const lockoutEnd = lastAttempt + LOCKOUT_MINUTES * 60 * 1000;
    if (now < lockoutEnd) {
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds: Math.ceil((lockoutEnd - now) / 1000),
      };
    }
    // Lockout expired, clear old attempts for this IP
    await db
      .prepare("DELETE FROM login_attempts WHERE ip = ?")
      .bind(ip)
      .run();
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - attemptCount,
  };
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(ip: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("INSERT INTO login_attempts (ip, timestamp) VALUES (?, ?)")
    .bind(ip, Date.now())
    .run();
}

/**
 * Clear attempts for an IP after successful login
 */
export async function clearAttempts(ip: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("DELETE FROM login_attempts WHERE ip = ?")
    .bind(ip)
    .run();
}
