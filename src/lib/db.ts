import { getCloudflareContext } from "@opennextjs/cloudflare";

// Get D1 database binding
export async function getDB(): Promise<D1Database> {
  const ctx = await getCloudflareContext();
  const env = ctx.env as unknown as Cloudflare.Env;
  return env.DB;
}

// Helper to execute queries with typed results
export async function query<T>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = await getDB();
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results;
}

// Helper to execute a single query
export async function queryFirst<T>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const db = await getDB();
  const result = await db.prepare(sql).bind(...params).first<T>();
  return result;
}

// Helper to execute insert/update/delete
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  const db = await getDB();
  return db.prepare(sql).bind(...params).run();
}

// D1Result type
interface D1Result {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
}
