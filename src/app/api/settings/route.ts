import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { execute, query } from "@/lib/db";
import type { Settings } from "@/lib/types";
import { NextResponse } from "next/server";

interface SettingRow {
  key: string;
  value: string;
}

// GET /api/settings - Get all settings
export async function GET() {
  try {
    const rows = await query<SettingRow>("SELECT key, value FROM settings");
    
    const settings: Settings = {
      site_title: "My Links",
      site_description: "All my important links in one place",
      profile_initial: "M",
      profile_image_url: "",
    };

    for (const row of rows) {
      if (row.key in settings) {
        settings[row.key as keyof Settings] = row.value;
      }
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: Request) {
  try {
    await requireAuth();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const body: Partial<Settings> = await request.json();

    for (const [key, value] of Object.entries(body)) {
      if (["site_title", "site_description", "profile_initial", "profile_image_url"].includes(key)) {
        await execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          [key, value ?? ""]
        );
      }
    }

    // Return updated settings
    const rows = await query<SettingRow>("SELECT key, value FROM settings");
    const settings: Settings = {
      site_title: "My Links",
      site_description: "All my important links in one place",
      profile_initial: "M",
      profile_image_url: "",
    };

    for (const row of rows) {
      if (row.key in settings) {
        settings[row.key as keyof Settings] = row.value;
      }
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
