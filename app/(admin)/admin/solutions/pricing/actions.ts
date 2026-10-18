"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PLAN_KEYS, PLAN_LIMITS, type MarketConfig, type MarketPlan } from "@/lib/solution-market";
import type { Json } from "@/types/database";

export type SaveMarketResult = { ok: true } | { ok: false; error: string };

const planSchema = z.object({
  key: z.enum(PLAN_KEYS),
  name: z.string().trim().min(1, "플랜 이름을 입력하세요.").max(PLAN_LIMITS.nameMax, `플랜 이름은 ${PLAN_LIMITS.nameMax}자 이내로 입력하세요.`),
  tagline: z.string().trim().max(PLAN_LIMITS.taglineMax, `한 줄 소개는 ${PLAN_LIMITS.taglineMax}자 이내로 입력하세요.`),
  apps: z.number().int().min(1, "앱 수는 1개 이상이어야 합니다.").max(PLAN_LIMITS.appsMax).nullable(),
  seats: z.number().int().min(0, "직원 초대 수는 0명 이상이어야 합니다.").max(PLAN_LIMITS.seatsMax),
  monthly: z.number().int().min(1, "월 구독료는 1원 이상이어야 합니다.").max(PLAN_LIMITS.priceMax),
});

const marketSchema = z.object({
  plans: z.array(planSchema).length(PLAN_KEYS.length),
  yearlyMonths: z.number().int().min(1, "연간 결제 개월 수는 1~12 사이여야 합니다.").max(12, "연간 결제 개월 수는 1~12 사이여야 합니다."),
  featured: z.enum(PLAN_KEYS),
});

// 솔루션 마켓 플랜 설정 저장 — pb_app_settings.solution_market (JSONB) 단일 키.
// 공개 마켓 페이지·어드민 구독 폼이 이 키를 읽는다 (없으면 lib/solution-market 기본값).
export async function saveMarketConfig(input: MarketConfig): Promise<SaveMarketResult> {
  const role = await getCurrentRole();
  if (role !== "admin") return { ok: false, error: "운영자 권한이 필요합니다." };

  const parsed = marketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }
  const plans = PLAN_KEYS.map((k) => parsed.data.plans.find((p) => p.key === k)).filter(
    (p): p is MarketPlan => p !== undefined,
  );
  if (plans.length !== PLAN_KEYS.length) return { ok: false, error: "플랜 구성이 올바르지 않습니다." };

  const value: MarketConfig = { plans, yearlyMonths: parsed.data.yearlyMonths, featured: parsed.data.featured };
  try {
    const supabase = await createClient(); // pb_app_settings_admin RLS (is_admin) 경유
    const { error } = await supabase
      .from("pb_app_settings")
      .upsert({ key: "solution_market", value: value as unknown as Json }, { onConflict: "key" });
    if (error) return { ok: false, error: error.message };
  } catch {
    return { ok: false, error: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/solutions");
  revalidatePath("/admin/solutions");
  revalidatePath("/admin/solutions/pricing");
  return { ok: true };
}
