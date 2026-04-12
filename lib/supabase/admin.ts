import { createClient } from "./server";
import { SupabaseClient, User } from "@supabase/supabase-js";

type AuthSuccess = { authorized: true; user: User; supabase: SupabaseClient };
type AuthFailure = { authorized: false; status: number; error: string };
export type AuthResult = AuthSuccess | AuthFailure;

export async function requireAdmin(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false, status: 401, error: "Unauthorized" };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    return { authorized: false, status: 403, error: "Forbidden" };
  }

  return { authorized: true, user, supabase };
}
