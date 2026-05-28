"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import {
  AD_PLATFORM_OPTIONS,
  isValidYearMonth,
} from "@/lib/schemas/ad-spend";
import type { Json } from "@/types/database";

export type SpendResult = { ok: true; message: string } | { ok: false; error: string };

const PLATFORM_VALUES = AD_PLATFORM_OPTIONS.map((p) => p.value);

// 월별 광고비 1건 저장(upsert). request 단위로 period가 유니크.
export async function saveAdSpend(
  requestId: string,
  formData: FormData,
): Promise<SpendResult> {
  const role = await getCurrentRole();
  if (role !== "client") return { ok: false, error: "광고주만 사용할 수 있습니다." };

  const period = String(formData.get("period_yearmonth") ?? "");
  if (!isValidYearMonth(period)) {
    return { ok: false, error: "기간을 YYYY-MM 형식으로 입력해주세요." };
  }

  const amounts: Record<string, number> = {};
  for (const p of PLATFORM_VALUES) {
    const raw = formData.get(`amount_${p}`);
    const n = Number(raw);
    if (raw && !Number.isNaN(n) && n > 0) amounts[p] = Math.round(n);
  }
  if (Object.keys(amounts).length === 0) {
    return { ok: false, error: "최소 한 개 매체의 광고비를 입력해주세요." };
  }

  const supabase = await createClient();
  // request 소유 검증은 RLS(ash_client)가 담당
  const { error } = await supabase.from("ad_spend_history").upsert(
    {
      request_id: requestId,
      period_yearmonth: period,
      platform_amounts: amounts as unknown as Json,
    },
    { onConflict: "request_id,period_yearmonth" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/client/request/${requestId}`);
  return { ok: true, message: `${period} 광고비를 저장했습니다.` };
}
