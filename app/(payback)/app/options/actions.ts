"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPbClientId } from "@/lib/auth";
import {
  currentPeriodKst,
  effectiveOptionsForPeriod,
  nextMonthFirst,
  todayKst,
  type OptionChange,
} from "@/lib/payback-domain";

export type OptionResult = { ok: true; effectiveFrom: string } | { ok: false; error: string };

// 옵션 변경 신청 (D4: 익월 1일 적용)
export async function requestOptionChange(
  field: "all_solutions" | "consulting",
  newValue: boolean,
): Promise<OptionResult> {
  const clientId = await getCurrentPbClientId();
  if (!clientId) return { ok: false, error: "권한이 없습니다." };

  const supabase = await createClient();
  const { data: agreement } = await supabase
    .from("pb_agreements")
    .select("id, all_solutions, consulting, rate_table_id")
    .eq("client_id", clientId)
    .eq("status", "active")
    .maybeSingle();
  if (!agreement) return { ok: false, error: "활성 약정이 없습니다." };

  const admin = createAdminClient();
  const { data: changes } = await admin
    .from("pb_option_changes")
    .select("field, new_value, effective_from, applied_at")
    .eq("agreement_id", agreement.id);

  // 현재(다음 달 기준) 유효값과 같은 값으로의 변경은 무의미
  const effectiveFrom = nextMonthFirst(todayKst());
  const nextMonthPeriod = effectiveFrom.slice(0, 7);
  const projected = effectiveOptionsForPeriod(
    { all_solutions: agreement.all_solutions, consulting: agreement.consulting },
    (changes ?? []) as OptionChange[],
    nextMonthPeriod,
  );
  if (projected[field] === newValue) {
    return { ok: false, error: "이미 해당 상태로 예약/적용되어 있습니다." };
  }

  // 컨설팅 켜기: 최근 확정 정산의 광고비 700만 이상만 (D3)
  if (field === "consulting" && newValue) {
    const [{ data: recent }, { data: rt }] = await Promise.all([
      admin
        .from("pb_monthly_settlements")
        .select("ad_spend_total")
        .eq("client_id", clientId)
        .in("status", ["confirmed", "paid"])
        .order("period", { ascending: false })
        .limit(1),
      admin
        .from("pb_rate_tables")
        .select("consulting_min_spend")
        .eq("id", agreement.rate_table_id)
        .maybeSingle(),
    ]);
    const minSpend = rt?.consulting_min_spend ?? 7_000_000;
    const lastSpend = recent?.[0]?.ad_spend_total ?? 0;
    if (lastSpend < minSpend) {
      return {
        ok: false,
        error: `주간/월간 전문가 컨설팅 옵션은 월 광고비 ${(minSpend / 10_000).toLocaleString()}만 원 이상 구간에서 선택 가능합니다. (최근 확정 정산 광고비: ${lastSpend.toLocaleString()}원)`,
      };
    }
  }

  const currentValue = effectiveOptionsForPeriod(
    { all_solutions: agreement.all_solutions, consulting: agreement.consulting },
    (changes ?? []) as OptionChange[],
    currentPeriodKst(),
  )[field];

  const { error } = await admin.from("pb_option_changes").insert({
    agreement_id: agreement.id,
    field,
    old_value: currentValue,
    new_value: newValue,
    effective_from: effectiveFrom,
    reason: "user_request",
  });
  if (error) return { ok: false, error: error.message };

  await admin.from("pb_audit_logs").insert({
    actor_id: null,
    action: "option.request",
    entity: "pb_agreements",
    entity_id: agreement.id,
    diff: { field, new_value: newValue, effective_from: effectiveFrom },
  });

  revalidatePath("/app/options");
  return { ok: true, effectiveFrom };
}
