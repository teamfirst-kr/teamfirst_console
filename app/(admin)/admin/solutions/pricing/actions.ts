"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole } from "@/lib/auth";
import type { SolutionPricingConfig } from "@/lib/solution-pricing";
import type { Json } from "@/types/database";

export type SavePricingResult = { ok: true } | { ok: false; error: string };

const priceInt = z.number().int().min(1, "금액은 1원 이상이어야 합니다.").max(1_000_000_000);

const pricingSchema = z.object({
  catchlogTiers: z
    .array(z.object({ pv: z.number().int().min(10_000).max(100_000_000), monthly: priceInt }))
    .min(1, "CatchLog 구간을 1개 이상 입력하세요."),
  catchlogExtraPer100k: priceInt,
  catchlogMaxPv: z.number().int().min(100_000).max(100_000_000),
  catchlogYearlyMonths: z.number().int().min(1).max(12),
  fixed: z.object({
    report: z.object({ monthly: priceInt, yearly: priceInt }),
    bid: z.object({ monthly: priceInt, yearly: priceInt }),
  }),
  bundleDiscount: z.object({
    2: z.number().int().min(0).max(90),
    3: z.number().int().min(0).max(90),
  }),
});

// 솔루션 요금 설정 저장 — pb_app_settings.solution_pricing (JSONB) 단일 키.
// 공개 요금 페이지·어드민 구독 폼이 모두 이 키를 읽는다 (없으면 코드 기본값).
export async function saveSolutionPricing(input: SolutionPricingConfig): Promise<SavePricingResult> {
  const role = await getCurrentRole();
  if (role !== "admin") return { ok: false, error: "운영자 권한이 필요합니다." };

  const parsed = pricingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  // PV 오름차순 정렬 + 중복 PV 제거 (뒤 항목 우선)
  const tiersMap = new Map<number, number>();
  for (const t of parsed.data.catchlogTiers) tiersMap.set(t.pv, t.monthly);
  const tiers = [...tiersMap.entries()]
    .map(([pv, monthly]) => ({ pv, monthly }))
    .sort((a, b) => a.pv - b.pv);

  const value: SolutionPricingConfig = {
    ...parsed.data,
    catchlogTiers: tiers,
    bundleDiscount: { 2: parsed.data.bundleDiscount[2], 3: parsed.data.bundleDiscount[3] },
  };

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("pb_app_settings")
      .upsert({ key: "solution_pricing", value: value as unknown as Json }, { onConflict: "key" });
    if (error) return { ok: false, error: error.message };
  } catch {
    return { ok: false, error: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/solutions");
  revalidatePath("/admin/solutions/pricing");
  return { ok: true };
}
