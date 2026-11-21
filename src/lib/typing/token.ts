import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Signed start tokens for the typing leaderboard.
 * The page fetches one before a test; a submitted score must be at least as old
 * as the test it claims, so a script cannot post a 60s result a second later.
 */

const MAX_AGE_MS = 30 * 60 * 1000;

async function secret(): Promise<string> {
  const ctx = await getCloudflareContext({ async: true });
  const env = ctx.env as unknown as { ADMIN_PASSWORD_HASH?: string };
  return `typing:${env.ADMIN_PASSWORD_HASH || 'dev-only-secret'}`;
}

async function sign(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(await secret()), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function issueStartToken(): Promise<string> {
  const data = `${Date.now()}.${crypto.randomUUID()}`;
  return `${data}.${await sign(data)}`;
}

/** Returns the token's issue time, or null when it is forged or expired. */
export async function verifyStartToken(token: unknown): Promise<number | null> {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [issued, nonce, sig] = parts;
  const expected = await sign(`${issued}.${nonce}`);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  const at = Number(issued);
  if (!Number.isFinite(at) || Date.now() - at > MAX_AGE_MS) return null;
  return at;
}

export async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`${await secret()}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
}
