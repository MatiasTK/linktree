import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { execute, query } from "@/lib/db";
import type { CreateSectionRequest, Section } from "@/lib/types";
import { NextResponse } from "next/server";

// GET /api/sections - Get all sections
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showInMainOnly = searchParams.get("mainOnly") === "true";

    let sql = "SELECT * FROM sections";
    if (showInMainOnly) {
      sql += " WHERE show_in_main = 1";
    }
    sql += " ORDER BY display_order ASC";

    const sections = await query<Section>(sql);
    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}

// POST /api/sections - Create a new section
export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const body: CreateSectionRequest = await request.json();
    const { 
      title, 
      slug, 
      show_in_main = true, 
      display_order = 0,
      description = null,
      profile_initial = null,
      profile_image_url = null
    } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: "Title and slug are required" },
        { status: 400 }
      );
    }

    const result = await execute(
      `INSERT INTO sections (title, slug, show_in_main, display_order, description, profile_initial, profile_image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, show_in_main ? 1 : 0, display_order, description, profile_initial, profile_image_url]
    );

    const newSection = await query<Section>(
      "SELECT * FROM sections WHERE id = ?",
      [result.meta.last_row_id]
    );

    return NextResponse.json(
      { success: true, data: newSection[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating section:", error);
    const message = error instanceof Error ? error.message : "Failed to create section";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
