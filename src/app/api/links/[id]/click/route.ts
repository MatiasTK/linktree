import { execute } from "@/lib/db";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/links/[id]/click - Track link click
// This endpoint uses waitUntil to track clicks asynchronously
export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Fire-and-forget: increment click counter without blocking
  // In Cloudflare Workers, this would use ctx.waitUntil()
  // For now, we use a Promise that we don't await
  incrementClickCount(id).catch((error) => {
    console.error("Error tracking click:", error);
  });

  return NextResponse.json({ success: true });
}

async function incrementClickCount(linkId: string) {
  await execute(
    "UPDATE links SET clicks = clicks + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [linkId]
  );
}
