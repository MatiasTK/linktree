import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

interface CloudflareEnv {
  DB: D1Database;
  ADMIN_PASSWORD_HASH?: string;
}

export interface AuthUser {
  isAuthenticated: boolean;
}

/**
 * Hash a password using SHA-256 with a salt
 * The format is: salt:hash (both in hex)
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const actualSalt = salt || crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(actualSalt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${actualSalt}:${hashHex}`;
}

/**
 * Verify a password against a hash using constant-time comparison
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt] = storedHash.split(":");
  if (!salt) return false;

  const computedHash = await hashPassword(password, salt);

  // Constant-time comparison to prevent timing attacks
  if (computedHash.length !== storedHash.length) return false;

  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Create a signed session token
 */
async function createSessionToken(passwordHash: string): Promise<string> {
  const expires = Date.now() + SESSION_DURATION * 1000;
  const data = `admin:${expires}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(passwordHash);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${data}:${sigHex}`;
}

/**
 * Verify a session token
 */
async function verifySessionToken(token: string, passwordHash: string): Promise<boolean> {
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [user, expiresStr, signature] = parts;
  const expires = parseInt(expiresStr, 10);

  // Check expiration
  if (isNaN(expires) || Date.now() > expires) return false;

  // Verify signature
  const data = `${user}:${expiresStr}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(passwordHash);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (signature.length !== expectedHex.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Get the password hash from environment
 */
async function getPasswordHash(): Promise<string | null> {
  const ctx = await getCloudflareContext();
  const env = ctx.env as unknown as CloudflareEnv;
  return env.ADMIN_PASSWORD_HASH || null;
}

/**
 * Check if user is authenticated via session cookie
 */
export async function getAuthUser(): Promise<AuthUser> {
  // In development mode, allow all requests
  if (process.env.NODE_ENV === "development") {
    return { isAuthenticated: true };
  }

  const passwordHash = await getPasswordHash();
  if (!passwordHash) {
    // No password configured, deny access
    return { isAuthenticated: false };
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return { isAuthenticated: false };
  }

  const isValid = await verifySessionToken(sessionCookie.value, passwordHash);
  return { isAuthenticated: isValid };
}

/**
 * Verify that the request is authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user.isAuthenticated) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Login with password, returns session token if successful
 */
export async function login(password: string): Promise<string | null> {
  const passwordHash = await getPasswordHash();
  if (!passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid) {
    return null;
  }

  return createSessionToken(passwordHash);
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export { SESSION_COOKIE_NAME, SESSION_DURATION };
