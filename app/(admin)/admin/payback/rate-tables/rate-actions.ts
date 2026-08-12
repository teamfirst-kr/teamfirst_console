"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole } from "@/lib/auth";
import type { RateTier } from "@/lib/payback";
import type { Json } from "@/types/database";

export type RateTableResult = { ok: true } | { ok: false; error: string };

// 신규 요율표 버전 작성 (D13 — 게시해도 기존 약정 불변)
export async function createRateTable(
  _prev: RateTableResult | null,
  formData: FormData,
): Promise<RateTableResult> {
  const role = await getCurrentRole();
  if (role !== "admin") return { ok: false, error: "운영자 권한이 필요합니다." };

  const version = String(formData.get("version") ?? "").trim();
  const effectiveFrom = String(formData.get("effective_from") ?? "").trim();
  const tiersRaw = String(formData.get("tiers") ?? "").trim();
  const allSolutions = Number(formData.get("mod_all") ?? 1);
  const consulting = Number(formData.get("mod_consulting") ?? 2);
  const minSpend = Number(String(formData.get("min_spend") ?? "").replace(/\D/g, "")) || 7_000_000;
  const publish = formData.get("published") === "on";

  if (!version) return { ok: false, error: "버전명을 입력해주세요. (예: v1.1)" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
    return { ok: false, error: "적용일은 YYYY-MM-DD 형식입니다." };
  }

  // tiers: "0,3000000,7 / 3000000,7000000,8 / ..." (min,max,rate — max 비우면 무제한)
  const tiers: RateTier[] = [];
  for (const part of tiersRaw.split("/")) {
    const [minS, maxS, rateS] = part.split(",").map((v) => v.trim());
    if (!minS && !rateS) continue;
    const min = Number(minS);
    const max = maxS === "" || maxS === undefined || maxS === "null" ? null : Number(maxS);
    const rate = Number(rateS);
    if (!Number.isFinite(min) || !Number.isFinite(rate) || (max !== null && !Number.isFinite(max))) {
      return { ok: false, error: `구간 형식 오류: "${part.trim()}" — min,max,rate 로 입력` };
    }
    tiers.push({ min, max, rate });
  }
  if (tiers.length === 0) return { ok: false, error: "구간을 1개 이상 입력해주세요." };
  // 검증: 연속 구간
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  if (sorted[0].min !== 0) return { ok: false, error: "첫 구간의 min은 0이어야 합니다." };
  for (let i = 0; i < sorted.length - 1; i += 1) {
    if (sorted[i].max !== sorted[i + 1].min) {
      return { ok: false, error: "구간이 연속되지 않습니다. (앞 구간 max = 다음 구간 min)" };
    }
  }
  if (sorted[sorted.length - 1].max !== null) {
    return { ok: false, error: "마지막 구간의 max는 비워야(무제한) 합니다." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("pb_rate_tables").insert({
    version,
    effective_from: effectiveFrom,
    tiers: sorted as unknown as Json,
    modifiers: { allSolutions, consulting } as unknown as Json,
    consulting_min_spend: minSpend,
    published: publish,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/payback/rate-tables");
  return { ok: true };
}

export async function setRateTablePublished(
  id: string,
  published: boolean,
): Promise<RateTableResult> {
  const role = await getCurrentRole();
  if (role !== "admin") return { ok: false, error: "운영자 권한이 필요합니다." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("pb_rate_tables")
    .update({ published })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/payback/rate-tables");
  return { ok: true };
}
