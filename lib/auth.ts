import { redirect } from "next/navigation";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Role }>();

  return data?.role ?? null;
}

// 로그인 + 역할 일치 보장. 미일치 시 안전한 경로로 리다이렉트.
export async function requireRole(role: Role) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/")}`);
  }

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Role }>();

  const current = data?.role ?? null;
  if (current !== role) {
    redirect(roleHome(current));
  }

  return { user, role: current };
}

export function roleHome(role: Role | null): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "partner":
      return "/partner/dashboard";
    case "client":
      return "/client/dashboard";
    default:
      return "/login";
  }
}
