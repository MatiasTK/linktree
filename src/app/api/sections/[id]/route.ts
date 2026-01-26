import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { execute, queryFirst } from "@/lib/db";
import type { Section, UpdateSectionRequest } from "@/lib/types";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sections/[id] - Get a single section
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const section = await queryFirst<Section>(
      "SELECT * FROM sections WHERE id = ?",
      [id]
    );

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    console.error("Error fetching section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch section" },
      { status: 500 }
    );
  }
}

// PUT /api/sections/[id] - Update a section
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body: UpdateSectionRequest = await request.json();

    const existing = await queryFirst<Section>(
      "SELECT * FROM sections WHERE id = ?",
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    // Check for display_order conflict
    if (body.display_order !== undefined && body.display_order !== existing.display_order) {
      const conflict = await queryFirst<Section>(
        "SELECT * FROM sections WHERE display_order = ? AND id != ?",
        [body.display_order, id]
      );

      if (conflict && !body.confirmSwap) {
        // Return warning for user to confirm swap
        return NextResponse.json({
          success: false,
          warning: true,
          message: `Display order ${body.display_order} is already used by "${conflict.title}". Confirm to swap orders.`,
          conflictWith: conflict,
          currentOrder: existing.display_order,
        });
      }

      if (conflict && body.confirmSwap) {
        // Execute swap: set conflict's order to current's order
        await execute(
          "UPDATE sections SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [existing.display_order, conflict.id]
        );
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.title !== undefined) {
      updates.push("title = ?");
      values.push(body.title);
    }
    if (body.slug !== undefined) {
      updates.push("slug = ?");
      values.push(body.slug);
    }
    if (body.show_in_main !== undefined) {
      updates.push("show_in_main = ?");
      values.push(body.show_in_main ? 1 : 0);
    }
    if (body.display_order !== undefined) {
      updates.push("display_order = ?");
      values.push(body.display_order);
    }
    if (body.description !== undefined) {
      updates.push("description = ?");
      values.push(body.description || null);
    }
    if (body.profile_initial !== undefined) {
      updates.push("profile_initial = ?");
      values.push(body.profile_initial || null);
    }
    if (body.profile_image_url !== undefined) {
      updates.push("profile_image_url = ?");
      values.push(body.profile_image_url || null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    await execute(
      `UPDATE sections SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const updated = await queryFirst<Section>(
      "SELECT * FROM sections WHERE id = ?",
      [id]
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update section" },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id] - Delete a section
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const existing = await queryFirst<Section>(
      "SELECT * FROM sections WHERE id = ?",
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    await execute("DELETE FROM sections WHERE id = ?", [id]);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete section" },
      { status: 500 }
    );
  }
}
