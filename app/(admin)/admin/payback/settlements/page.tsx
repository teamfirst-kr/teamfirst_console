import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { currentPeriodKst, isValidPeriod, prevPeriod } from "@/lib/payback-domain";
import type { PbSettlementRow } from "@/types/database";

import { SettlementGrid, type GridRow } from "./settlement-grid";

export const dynamic = "force-dynamic";

export default async function PaybackSettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period =
    sp.period && isValidPeriod(sp.period) ? sp.period : prevPeriod(currentPeriodKst());

  const supabase = await createClient();
  const [{ data: rows }, { data: clients }, { data: pendingTerms }] =
    await Promise.all([
      supabase
        .from("pb_monthly_settlements")
        .select("*")
        .eq("period", period)
        .order("created_at", { ascending: true }),
      supabase
        .from("pb_clients")
        .select("id, company_name, invoice_capable"),
      supabase
        .from("pb_option_changes")
        .select("agreement_id")
        .eq("field", "consulting")
        .eq("reason", "auto_consulting_termination")
        .is("applied_at", null),
    ]);

  const clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  const warnAgreements = new Set((pendingTerms ?? []).map((t) => t.agreement_id));

  const gridRows: GridRow[] = ((rows ?? []) as PbSettlementRow[]).map((s) => {
    const c = clientById.get(s.client_id);
    return {
      id: s.id,
      clientName: c?.company_name ?? "고객사",
      invoiceCapable: c?.invoice_capable ?? true,
      consultingWarn: warnAgreements.has(s.agreement_id),
      period: s.period,
      statementNo: s.statement_no,
      adSpendTotal: s.ad_spend_total,
      tierLabel: s.tier_label,
      baseRate: s.base_rate === null ? null : Number(s.base_rate),
      modifierTotal: s.modifier_total === null ? null : Number(s.modifier_total),
      appliedRate: s.applied_rate === null ? null : Number(s.applied_rate),
      supply: s.payback_supply,
      vat: s.payback_vat,
      total: s.payback_total,
      status: s.status,
      invoiceStatus: s.invoice_status,
      invoiceDue: s.invoice_due,
      reconciled: s.reconciled,
      disputeFlag: s.dispute_flag,
    };
  });

  // 기간 내비게이션
  const cur = currentPeriodKst();
  const periods: string[] = [];
  let p = cur;
  for (let i = 0; i < 6; i += 1) {
    periods.push(p);
    p = prevPeriod(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">페이백 월 정산</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            생성 → 광고비 입력(CSV) → 일괄 확정 → 계산서·대사 → 지급까지 이 화면에서
            끝냅니다.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {periods.map((pp) => (
            <Link
              key={pp}
              href={`/admin/payback/settlements?period=${pp}`}
              className={
                "rounded-full border px-3 py-1 text-xs transition-colors " +
                (pp === period
                  ? "border-secondary bg-secondary font-semibold text-white"
                  : "border-border bg-card text-muted-foreground hover:bg-accent")
              }
            >
              {pp}
            </Link>
          ))}
        </div>
      </div>

      <SettlementGrid period={period} rows={gridRows} />
    </div>
  );
}
