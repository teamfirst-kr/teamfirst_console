import { createClient } from "@/lib/supabase/server";

export type Role = "client" | "partner" | "admin";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentRole(): Promise<Role | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const role = user.app_metadata?.role;
  if (role === "client" || role === "partner" || role === "admin") {
    return role;
  }
  return null;
}

export async function requireRole(role: Role) {
  const current = await getCurrentRole();
  if (current !== role) {
    throw new Error(`Forbidden: ${role} 권한이 필요합니다.`);
  }
}
