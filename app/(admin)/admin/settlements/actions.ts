"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import type { Json } from "@/types/database";

export type SettleState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") throw new Error("운영자 권한이 필요합니다.");
}

// 계약(deal) 수수료율·상태·계약서 URL 보정
export async function updateDeal(
  dealId: string,
  _prev: SettleState,
  formData: FormData,
): Promise<SettleState> {
  await assertAdmin();
  const supabase = await createClient();

  const partnerFee = Number(formData.get("partner_fee_rate"));
  const tfShare = Number(formData.get("teamfirst_share_rate"));
  const status = String(formData.get("status") ?? "contracted");
  const contractUrl = String(formData.get("contract_url") ?? "").trim();

  const { error } = await supabase
    .from("deals")
    .update({
      partner_fee_rate: Number.isFinite(partnerFee) && partnerFee > 0 ? partnerFee : null,
      teamfirst_share_rate: Number.isFinite(tfShare) && tfShare > 0 ? tfShare : null,
      status,
      activated_at: status === "active" ? new Date().toISOString() : undefined,
      contract_url: contractUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settlements");
  return { ok: true, message: "계약 정보를 저장했습니다." };
}

// 월별 정산 생성: 매체별 소진액 입력 → 합계·대행수수료·팀퍼스트 정산액 자동 산정
export async function createSettlement(
  dealId: string,
  platforms: string[],
  partnerFeeRate: number | null,
  tfShareRate: number | null,
  _prev: SettleState,
  formData: FormData,
): Promise<SettleState> {
  await assertAdmin();
  const supabase = await createClient();

  const yearmonth = String(formData.get("yearmonth") ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(yearmonth)) {
    return { ok: false, error: "정산 월을 YYYY-MM 형식으로 입력해주세요." };
  }
  if (!partnerFeeRate) {
    return { ok: false, error: "먼저 대행 수수료율(%)을 저장해주세요." };
  }

  const breakdown: Record<string, number> = {};
  let totalSpend = 0;
  for (const p of platforms) {
    const n = Number(
      String(formData.get(`spend_${p}`) ?? "").replace(/[^\d]/g, ""),
    );
    if (n > 0) {
      breakdown[p] = n;
      totalSpend += n;
    }
  }
  if (totalSpend === 0) {
    return { ok: false, error: "매체별 소진액을 한 개 이상 입력해주세요." };
  }

  const partnerFee = Math.round((totalSpend * partnerFeeRate) / 100);
  const teamfirstShare = tfShareRate
    ? Math.round((partnerFee * tfShareRate) / 100)
    : 0;

  const { error } = await supabase.from("settlements").insert({
    deal_id: dealId,
    yearmonth,
    spend_breakdown: breakdown as unknown as Json,
    total_spend: totalSpend,
    partner_fee: partnerFee,
    teamfirst_share: teamfirstShare,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "해당 월의 정산이 이미 존재합니다." };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin/settlements");
  return { ok: true, message: `${yearmonth} 정산을 생성했습니다.` };
}

// 정산 상태 전이 (발행/입금) + 청구서 URL
export async function setSettlementStatus(
  settlementId: string,
  status: "pending" | "invoiced" | "paid",
): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase
    .from("settlements")
    .update({
      status,
      invoiced_at: status === "invoiced" ? new Date().toISOString() : undefined,
      paid_at: status === "paid" ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", settlementId);
  revalidatePath("/admin/settlements");
}
