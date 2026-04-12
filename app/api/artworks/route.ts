import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    // Supabase not configured — return empty array
    return NextResponse.json([]);
  }
}
