import { createClient } from "@/lib/supabase/server";
import { rateTableFromRow, type RateTable } from "@/lib/payback";

import { PaybackApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "페이백 신청 — TeamFirst",
};

const FALLBACK_TABLE: RateTable = {
  version: "v1.1",
  tiers: [
    { min: 0, max: 3_000_000, rate: 7 },
    { min: 3_000_000, max: 7_000_000, rate: 8 },
    { min: 7_000_000, max: 20_000_000, rate: 10 },
    { min: 20_000_000, max: null, rate: 11 },
  ],
  modifiers: { allSolutions: 1, consulting: 2 },
  consultingMinSpend: 7_000_000,
};

export default async function PaybackApplyPage() {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("pb_rate_tables")
    .select("version, tiers, modifiers, consulting_min_spend")
    .eq("published", true)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  const table = row ? rateTableFromRow(row) : FALLBACK_TABLE;
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-bold text-secondary">광고비 페이백 신청</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        사업자등록을 보유한 광고주라면 누구나 신청할 수 있습니다. 접수 후 영업일
        기준 1~2일 내 담당자가 연락드립니다.
      </p>
      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <PaybackApplyForm table={table} />
      </div>
    </div>
  );
}
