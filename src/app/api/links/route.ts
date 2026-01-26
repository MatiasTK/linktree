import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { execute, query } from "@/lib/db";
import type { CreateLinkRequest, Link } from "@/lib/types";
import { NextResponse } from "next/server";

// GET /api/links - Get all links (optionally filtered by section)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("sectionId");
    const visibleOnly = searchParams.get("visibleOnly") === "true";

    let sql = "SELECT * FROM links";
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (sectionId) {
      conditions.push("section_id = ?");
      params.push(sectionId);
    }

    if (visibleOnly) {
      conditions.push("is_visible = 1");
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY display_order ASC";

    const links = await query<Link>(sql, params);
    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}

// POST /api/links - Create a new link
export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const body: CreateLinkRequest = await request.json();
    const {
      section_id,
      label,
      url,
      icon_type = "link",
      is_visible = true,
      display_order = 0,
      group_title = null,
      group_order = 0,
    } = body;

    if (!section_id || !label || !url) {
      return NextResponse.json(
        { success: false, error: "section_id, label, and url are required" },
        { status: 400 }
      );
    }

    const result = await execute(
      `INSERT INTO links (section_id, label, url, icon_type, is_visible, display_order, group_title, group_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [section_id, label, url, icon_type, is_visible ? 1 : 0, display_order, group_title, group_order]
    );

    const newLink = await query<Link>("SELECT * FROM links WHERE id = ?", [
      result.meta.last_row_id,
    ]);

    return NextResponse.json(
      { success: true, data: newLink[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating link:", error);
    const message = error instanceof Error ? error.message : "Failed to create link";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
