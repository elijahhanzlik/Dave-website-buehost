import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { siteSettingSchema } from "@/lib/validations";
import { z } from "zod";

// Allow large bodies for data URL images
export const maxDuration = 30;

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json([], { status: 200 });
  }
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

const bulkSettingsSchema = z.object({
  settings: z.array(siteSettingSchema),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = bulkSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: JSON.stringify(parsed.error.format?.() ?? parsed.error) },
        { status: 400 },
      );
    }

    // Upsert each setting individually so we can identify which fails
    for (const setting of parsed.data.settings) {
      const { error: upsertError } = await auth.supabase
        .from("site_settings")
        .upsert(
          {
            key: setting.key,
            value: setting.value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        );

      if (upsertError) {
        return NextResponse.json(
          { error: `Failed to save "${setting.key}": ${upsertError.message}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
