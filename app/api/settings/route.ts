import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { siteSettingSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET() {
  const supabase = await createClient();
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
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = bulkSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const upserts = parsed.data.settings.map((setting) =>
    auth.supabase.from("site_settings").upsert(
      {
        key: setting.key,
        value: setting.value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    ),
  );

  const results = await Promise.all(upserts);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
