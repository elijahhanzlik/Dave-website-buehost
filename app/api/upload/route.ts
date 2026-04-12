import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { filename, contentType } = await request.json();
  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType are required" },
      { status: 400 },
    );
  }

  const ext = filename.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { data, error } = await auth.supabase.storage
    .from("artwork-images")
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicUrl = auth.supabase.storage
    .from("artwork-images")
    .getPublicUrl(path).data.publicUrl;

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl,
  });
}
