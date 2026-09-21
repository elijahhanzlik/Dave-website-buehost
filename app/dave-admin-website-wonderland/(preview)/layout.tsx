import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Chrome-free admin routes — pages the admin embeds in an <iframe>, such as
 * the live gallery preview. Same gate as the `(authenticated)` layout (via
 * `requireAdmin`), but without the sidebar or the padded <main>, so the page
 * can render the public site's markup edge to edge.
 *
 * The parent admin layout is a flex row in admin ink; this wrapper restores
 * the public site's body styling (see app/layout.tsx and app/(public)/layout.tsx).
 */
export default async function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    redirect("/dave-admin-website-wonderland/login");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-cream text-text-primary">
      {children}
    </div>
  );
}
