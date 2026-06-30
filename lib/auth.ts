import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type Role = "client" | "partner" | "admin" | "marketer";

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
    // 미들웨어가 주입한 현재 경로로 복귀하도록 next 보존.
    const path = (await headers()).get("x-pathname") || "/";
    redirect(`/login?next=${encodeURIComponent(path)}`);
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

export async function getCurrentPartnerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export async function getCurrentMarketerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("marketers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export function roleHome(role: Role | null): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "partner":
      return "/partner/dashboard";
    case "client":
      return "/client/dashboard";
    case "marketer":
      return "/marketer-console";
    default:
      return "/login";
  }
}
