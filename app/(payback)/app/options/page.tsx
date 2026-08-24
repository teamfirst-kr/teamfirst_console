import { createClient } from "@/lib/supabase/server";
import { getCurrentPbClientId } from "@/lib/auth";
import { calcPayback, rateTableFromRow } from "@/lib/payback";
import {
  currentPeriodKst,
  effectiveOptionsForPeriod,
  nextPeriod,
  type OptionChange,
} from "@/lib/payback-domain";
import { DateText } from "@/components/date-text";

import { OptionToggles } from "./option-toggles";

export const dynamic = "force-dynamic";

const FIELD_LABEL: Record<string, string> = {
  all_solutions: "솔루션 전체 이용",
  consulting: "월간 전문가 컨설팅",
};

export default async function PortalOptionsPage() {
  const supabase = await createClient();
  const clientId = await getCurrentPbClientId();
  if (!clientId) return null;

  const { data: agreement } = await supabase
    .from("pb_agreements")
    .select("id, all_solutions, consulting, rate_table_id")
    .eq("client_id", clientId)
    .eq("status", "active")
    .maybeSingle();
  if (!agreement) {
    return (
      <p className="text-sm text-muted-foreground">활성 약정이 없습니다.</p>
    );
  }

  const [{ data: changes }, { data: rt }, { data: recent }] = await Promise.all([
    supabase
      .from("pb_option_changes")
      .select("field, old_value, new_value, effective_from, applied_at, reason, requested_at")
      .eq("agreement_id", agreement.id)
      .order("requested_at", { ascending: false }),
    supabase
      .from("pb_rate_tables")
      .select("version, tiers, modifiers, consulting_min_spend")
      .eq("id", agreement.rate_table_id)
      .maybeSingle(),
    supabase
      .from("pb_monthly_settlements")
      .select("ad_spend_total")
      .eq("client_id", clientId)
      .in("status", ["confirmed", "paid"])
      .order("period", { ascending: false })
      .limit(1),
  ]);

  const base = {
    all_solutions: agreement.all_solutions,
    consulting: agreement.consulting,
  };
  const optionChanges = (changes ?? []) as (OptionChange & {
    old_value: boolean;
    applied_at: string | null;
    reason: string;
    requested_at: string;
  })[];
  const cur = currentPeriodKst();
  const currentOpts = effectiveOptionsForPeriod(base, optionChanges, cur);
  const nextOpts = effectiveOptionsForPeriod(base, optionChanges, nextPeriod(cur));

  const lastSpend = recent?.[0]?.ad_spend_total ?? 0;
  const table = rt ? rateTableFromRow(rt) : null;
  const eligible = table ? lastSpend >= table.consultingMinSpend : false;

  // 요율 미리보기 (최근 정산 광고비 기준)
  const previewSpend = lastSpend || 5_000_000;
  const rateOf = (all: boolean, consulting: boolean) =>
    table
      ? calcPayback(table, {
          adSpend: previewSpend,
          allSolutions: all,
          consulting,
          invoiceCapable: true,
        }).appliedRate
      : 0;
  const rateNow = rateOf(currentOpts.all_solutions, currentOpts.consulting);

  const autoTermPending = optionChanges.some(
    (c) => c.reason === "auto_consulting_termination" && !c.applied_at,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">옵션 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          옵션 변경은 <strong>익월 1일부터</strong> 적용됩니다. (당월 정산 미반영)
        </p>
      </div>

      {autoTermPending ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          월 광고비 2개월 연속 700만 원 미만으로 <strong>컨설팅 옵션이 익월 1일
          자동 해제될 예정</strong>입니다. 광고비가 회복되면 다시 신청할 수 있습니다.
        </div>
      ) : null}

      <OptionToggles
        currentAll={currentOpts.all_solutions}
        currentConsulting={currentOpts.consulting}
        nextAll={nextOpts.all_solutions}
        nextConsulting={nextOpts.consulting}
        consultingEligible={eligible}
        lastSpendLabel={lastSpend ? `${lastSpend.toLocaleString()}원` : "없음"}
        rateNow={rateNow}
        rateIfAll={rateOf(!nextOpts.all_solutions, nextOpts.consulting)}
        rateIfConsulting={rateOf(nextOpts.all_solutions, !nextOpts.consulting)}
      />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">변경 이력</h2>
        {optionChanges.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            변경 이력이 없습니다
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">항목</th>
                  <th className="px-4 py-2.5 font-medium">변경</th>
                  <th className="px-4 py-2.5 font-medium">적용일</th>
                  <th className="px-4 py-2.5 font-medium">신청일</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {optionChanges.map((c, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5">
                      {FIELD_LABEL[c.field]}
                      {c.reason === "auto_consulting_termination" ? (
                        <span className="ml-1 text-xs text-amber-600">(자동 해제)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.old_value ? "이용" : "미이용"} → {c.new_value ? "이용" : "미이용"}
                    </td>
                    <td className="px-4 py-2.5">{c.effective_from}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <DateText value={c.requested_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
