import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state"); // user_id
  const error = request.nextUrl.searchParams.get("error");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const adminRoute = process.env.ADMIN_ROUTE ?? "admin-panel";
  const settingsUrl = `${siteUrl}/${adminRoute}/settings`;

  if (error) {
    return NextResponse.redirect(
      `${settingsUrl}?notion_error=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${settingsUrl}?notion_error=missing_code`,
    );
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      `${settingsUrl}?notion_error=not_configured`,
    );
  }

  // Exchange code for access token
  const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(
      `${settingsUrl}?notion_error=token_exchange_failed`,
    );
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token as string;
  const workspaceName = (tokenData.workspace_name as string) ?? null;

  // Verify the authenticated user matches the state
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.id !== state) {
    return NextResponse.redirect(
      `${settingsUrl}?notion_error=auth_mismatch`,
    );
  }

  // Upsert Notion settings
  const { error: upsertError } = await supabase
    .from("notion_settings")
    .upsert(
      {
        user_id: user.id,
        access_token: accessToken,
        workspace_name: workspaceName,
        sync_enabled: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    return NextResponse.redirect(
      `${settingsUrl}?notion_error=save_failed`,
    );
  }

  return NextResponse.redirect(`${settingsUrl}?notion_connected=true`);
}
