"use server";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/email/admin-alert";

// 베스트에포트 rate limit (서버리스 인스턴스 단위)
const recentByIp = new Map<string, number[]>();
function leadRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (recentByIp.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (list.length >= 10) return true;
  list.push(now);
  recentByIp.set(ip, list);
  return false;
}

// 간편 신청 리드: 브랜드명 + 연락처 (+ 계산기 예산·CTA 위치) 즉시 저장 + 운영자 알림
export async function submitQuickLead(input: {
  brand: string;
  phone: string;
  budget?: number | null;
  source?: string;
}): Promise<{ ok: boolean }> {
  const brand = String(input.brand ?? "").trim().slice(0, 100);
  const phone = String(input.phone ?? "").replace(/[^\d+-]/g, "").slice(0, 20);
  if (!brand) return { ok: false };
  if (phone.replace(/\D/g, "").length < 9) return { ok: false };
  const budgetNum = Number(input.budget);
  const budget =
    Number.isSafeInteger(budgetNum) && budgetNum > 0 && budgetNum <= 10_000_000_000
      ? budgetNum
      : null;
  const source = String(input.source ?? "").slice(0, 40) || null;

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (leadRateLimited(ip)) return { ok: false };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("pb_leads").insert({
      brand_name: brand,
      phone,
      expected_budget: budget,
      source,
    });
    if (error) return { ok: false };
  } catch {
    return { ok: false };
  }

  // 핫리드 — 즉시 운영자 알림 (메일 + 인앱)
  await notifyAdmins({
    type: "pb_lead",
    title: "⚡ 페이백 간편 신청 리드",
    rows: [
      ["브랜드", brand],
      ["연락처", phone],
      ["월 예상 광고비", budget ? `${budget.toLocaleString()}원` : "미입력"],
      ["유입 위치", source ?? "-"],
    ],
    link: "/admin/payback",
    linkLabel: "리드 확인하기",
  });

  return { ok: true };
}
