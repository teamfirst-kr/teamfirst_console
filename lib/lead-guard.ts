import "server-only";

import { headers } from "next/headers";

import type { createAdminClient } from "@/lib/supabase/admin";

// 공개 리드 접수 방어 (D-093 3중 보안 — 2단계: 서버 접수 방어)
// 1) 허니팟: 사람에게 보이지 않는 입력칸이 채워져 있으면 봇 → 저장·알림 없이 성공처럼 응답
// 2) IP 단위 rate limit (서버리스 인스턴스 단위, 베스트에포트)
// 3) DB 기준 동일 연락처 반복 접수 차단 (인스턴스가 바뀌어도 유지)

export function isHoneypotHit(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

const buckets = new Map<string, number[]>();
export async function ipRateLimited(scope: string, limit: number, windowMs = 10 * 60_000): Promise<boolean> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const list = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) return true;
  list.push(now);
  buckets.set(key, list);
  if (buckets.size > 5000) buckets.clear(); // 메모리 상한
  return false;
}

// 같은 연락처로 10분 내 3건 이상 접수됐으면 차단 (조회 실패 시에는 접수를 막지 않는다)
export async function phoneBurstBlocked(admin: ReturnType<typeof createAdminClient>, phone: string): Promise<boolean> {
  try {
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count, error } = await admin
      .from("pb_leads")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", since);
    if (error) return false;
    return (count ?? 0) >= 3;
  } catch {
    return false;
  }
}
