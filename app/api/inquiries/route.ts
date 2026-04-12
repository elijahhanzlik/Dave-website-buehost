import { NextResponse, type NextRequest } from "next/server";
import { inquirySchema } from "@/lib/validations";

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, message } = parsed.data;

    // Try to insert into Supabase
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { error } = await supabase
        .from("inquiries")
        .insert({ name, email, message, status: "new" });

      if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json(
          { error: "Failed to save inquiry. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true }, { status: 201 });
    } catch {
      // Supabase not configured — accept the submission gracefully
      console.log("Inquiry received (Supabase not configured):", {
        name,
        email,
        message: message.slice(0, 50) + "...",
      });
      return NextResponse.json({ success: true }, { status: 201 });
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
