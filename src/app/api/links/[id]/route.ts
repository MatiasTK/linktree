import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { execute, queryFirst } from "@/lib/db";
import type { Link, UpdateLinkRequest } from "@/lib/types";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/links/[id] - Get a single link
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const link = await queryFirst<Link>("SELECT * FROM links WHERE id = ?", [
      id,
    ]);

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Link not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: link });
  } catch (error) {
    console.error("Error fetching link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch link" },
      { status: 500 }
    );
  }
}

// PUT /api/links/[id] - Update a link
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body: UpdateLinkRequest = await request.json();

    const existing = await queryFirst<Link>(
      "SELECT * FROM links WHERE id = ?",
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Link not found" },
        { status: 404 }
      );
    }

    // Check for display_order conflict within same section
    if (body.display_order !== undefined && body.display_order !== existing.display_order) {
      const conflict = await queryFirst<Link>(
        "SELECT * FROM links WHERE section_id = ? AND display_order = ? AND id != ?",
        [existing.section_id, body.display_order, id]
      );

      if (conflict && !body.confirmSwap) {
        return NextResponse.json({
          success: false,
          warning: true,
          message: `Display order ${body.display_order} is already used by "${conflict.label}". Confirm to swap orders.`,
          conflictWith: conflict,
          currentOrder: existing.display_order,
        });
      }

      if (conflict && body.confirmSwap) {
        await execute(
          "UPDATE links SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [existing.display_order, conflict.id]
        );
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.label !== undefined) {
      updates.push("label = ?");
      values.push(body.label);
    }
    if (body.url !== undefined) {
      updates.push("url = ?");
      values.push(body.url);
    }
    if (body.icon_type !== undefined) {
      updates.push("icon_type = ?");
      values.push(body.icon_type);
    }
    if (body.is_visible !== undefined) {
      updates.push("is_visible = ?");
      values.push(body.is_visible ? 1 : 0);
    }
    if (body.display_order !== undefined) {
      updates.push("display_order = ?");
      values.push(body.display_order);
    }
    if (body.group_title !== undefined) {
      updates.push("group_title = ?");
      values.push(body.group_title || null);
    }
    if (body.group_order !== undefined) {
      updates.push("group_order = ?");
      values.push(body.group_order);
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
      `UPDATE links SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const updated = await queryFirst<Link>(
      "SELECT * FROM links WHERE id = ?",
      [id]
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update link" },
      { status: 500 }
    );
  }
}

// DELETE /api/links/[id] - Delete a link
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const existing = await queryFirst<Link>(
      "SELECT * FROM links WHERE id = ?",
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Link not found" },
        { status: 404 }
      );
    }

    await execute("DELETE FROM links WHERE id = ?", [id]);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete link" },
      { status: 500 }
    );
  }
}
