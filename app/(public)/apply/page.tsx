import { createClient } from "@/lib/supabase/server";
import { rateTableFromRow, type RateTable } from "@/lib/payback";

import { ApplyExitSurvey } from "@/components/payback/exit-survey";

import { PaybackApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "페이백 신청 — TeamFirst",
};

const FALLBACK_TABLE: RateTable = {
  version: "v20260824",
  tiers: [
    { min: 0, max: 3_000_000, rate: 8 },
    { min: 3_000_000, max: 5_000_000, rate: 9 },
    { min: 5_000_000, max: 7_000_000, rate: 10 },
    { min: 7_000_000, max: 20_000_000, rate: 11 },
    { min: 20_000_000, max: null, rate: 12 },
  ],
  modifiers: { allSolutions: 1, consulting: 1 },
  consultingMinSpend: 5_000_000,
};

export default async function PaybackApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; phone?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: row }, { data: promoRow }] = await Promise.all([
    supabase
      .from("pb_rate_tables")
      .select("version, tiers, modifiers, consulting_min_spend")
      .eq("published", true)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("pb_app_settings")
      .select("value")
      .eq("key", "promo_first_month")
      .maybeSingle(),
  ]);
  const table = row ? rateTableFromRow(row) : FALLBACK_TABLE;
  const promoCfg = (promoRow?.value ?? null) as {
    enabled?: boolean;
    bonus_rate?: number;
    free_options?: boolean;
  } | null;
  const promo = promoCfg?.enabled
    ? {
        bonusRate: Number(promoCfg.bonus_rate ?? 1) || 0,
        freeOptions: promoCfg.free_options !== false,
      }
    : null;
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-bold text-secondary">광고비 페이백 신청</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        사업자등록을 보유한 광고주라면 누구나 신청할 수 있습니다. 접수 후 영업일
        기준 1~2일 내 담당자가 연락드립니다.
      </p>
      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <PaybackApplyForm
          table={table}
          promo={promo}
          initial={{
            brand: (sp.brand ?? "").slice(0, 100),
            phone: (sp.phone ?? "").slice(0, 20),
          }}
        />
      </div>
      <ApplyExitSurvey />
    </div>
  );
}
