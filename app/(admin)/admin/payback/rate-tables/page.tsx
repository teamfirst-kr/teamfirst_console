import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { tierLabelOf, type RateTier } from "@/lib/payback";

import { PublishToggle, RateTableForm } from "./rate-table-form";

export const dynamic = "force-dynamic";

export default async function PaybackRateTablesPage() {
  const supabase = await createClient();
  const [{ data: tables }, { data: usage }] = await Promise.all([
    supabase
      .from("pb_rate_tables")
      .select("id, version, effective_from, tiers, modifiers, consulting_min_spend, published, created_at")
      .order("effective_from", { ascending: false }),
    supabase.from("pb_agreements").select("rate_table_id"),
  ]);

  const usageCount = new Map<string, number>();
  for (const a of usage ?? []) {
    usageCount.set(a.rate_table_id, (usageCount.get(a.rate_table_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">요율표 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          요율표는 버전으로 관리됩니다. <strong>새 버전을 게시해도 기존 약정은 체결
          시점 버전을 그대로 유지합니다.</strong> (신규 약정부터 새 버전 적용)
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {(tables ?? []).map((t) => {
          const tiers = (t.tiers ?? []) as RateTier[];
          const mods = (t.modifiers ?? {}) as { allSolutions?: number; consulting?: number };
          return (
            <div key={t.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-secondary">{t.version}</span>
                  {t.published ? (
                    <Badge variant="default">게시 중</Badge>
                  ) : (
                    <Badge variant="muted">비공개</Badge>
                  )}
                </div>
                <PublishToggle id={t.id} published={t.published} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                적용일 {t.effective_from} · 약정 {usageCount.get(t.id) ?? 0}건 사용 중
              </p>
              <table className="mt-3 w-full text-sm">
                <tbody className="divide-y">
                  {tiers.map((tier) => (
                    <tr key={tier.min}>
                      <td className="py-1.5 text-muted-foreground">{tierLabelOf(tier)}</td>
                      <td className="py-1.5 text-right font-semibold">{tier.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground">
                옵션: 솔루션 전체 −{mods.allSolutions ?? 1}%p · 컨설팅 −{mods.consulting ?? 2}%p
                (기준 {(t.consulting_min_spend / 10_000).toLocaleString()}만 원)
              </p>
            </div>
          );
        })}
      </div>

      <RateTableForm />
    </div>
  );
}
