import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSubscriptionsToNotion, createNotionDatabase, listNotionDatabases } from "@/lib/notion";

// POST /api/integrations/notion/sync — trigger manual sync
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncSubscriptionsToNotion(supabase, user.id);
  return NextResponse.json(result);
}

// PUT /api/integrations/notion/sync — update Notion settings (database_id, sync_enabled)
export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { database_id, sync_enabled, create_new_db, parent_page_id } = body as {
    database_id?: string;
    sync_enabled?: boolean;
    create_new_db?: boolean;
    parent_page_id?: string;
  };

  // Check if user has Notion connected
  const { data: settings, error: settingsError } = await supabase
    .from("notion_settings")
    .select("access_token")
    .eq("user_id", user.id)
    .single();

  if (settingsError || !settings?.access_token) {
    return NextResponse.json(
      { error: "Notion not connected" },
      { status: 400 },
    );
  }

  let dbId = database_id;

  // Create a new database if requested
  if (create_new_db && parent_page_id) {
    try {
      dbId = await createNotionDatabase(settings.access_token, parent_page_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        { error: `Failed to create database: ${message}` },
        { status: 500 },
      );
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dbId !== undefined) updates.database_id = dbId;
  if (sync_enabled !== undefined) updates.sync_enabled = sync_enabled;

  const { error: updateError } = await supabase
    .from("notion_settings")
    .update(updates)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, database_id: dbId });
}

// GET /api/integrations/notion/sync — list available databases
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: settings, error: settingsError } = await supabase
    .from("notion_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (settingsError || !settings?.access_token) {
    return NextResponse.json(
      { error: "Notion not connected" },
      { status: 400 },
    );
  }

  try {
    const databases = await listNotionDatabases(settings.access_token);
    return NextResponse.json({
      databases,
      current_database_id: settings.database_id,
      sync_enabled: settings.sync_enabled,
      workspace_name: settings.workspace_name,
      last_synced_at: settings.last_synced_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to list databases: ${message}` },
      { status: 500 },
    );
  }
}
