import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";

export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/admin-panel/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin-panel/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    redirect("/admin-panel/login");
  }

  const { count } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  return (
    <>
      <AdminNav unreadCount={count ?? 0} />
      <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
    </>
  );
}
