import type { ApiResponse } from '@/lib/types';

/** JSON request to the admin API; resolves to the data or throws with the server's message. */
export async function api<T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let data: ApiResponse<T> | null = null;
  try {
    data = (await res.json()) as ApiResponse<T>;
  } catch {
    /* non-JSON error page */
  }

  if (res.status === 401) throw new Error('Your session expired. Log in again to keep editing.');
  if (!data || !data.success) throw new Error(data?.error || `The server answered ${res.status}. Try again.`);
  return data.data as T;
}
