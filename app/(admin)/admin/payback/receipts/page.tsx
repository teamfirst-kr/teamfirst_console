import { createClient } from "@/lib/supabase/server";
import { currentPeriodKst, prevPeriod } from "@/lib/payback-domain";

import { ReceiptForm } from "./receipt-form";

export const dynamic = "force-dynamic";

export default async function PaybackReceiptsPage() {
  const supabase = await createClient();

  const [{ data: receipts }, { data: settlements }, { data: rateSetting }] =
    await Promise.all([
      supabase
        .from("pb_media_receipts")
        .select("id, media, period, amount, received_at, memo")
        .order("period", { ascending: false })
        .limit(60),
      supabase
        .from("pb_monthly_settlements")
        .select("period, ad_spend_total")
        .neq("status", "canceled"),
      supabase
        .from("pb_app_settings")
        .select("value")
        .eq("key", "commission_rate")
        .maybeSingle(),
    ]);

  const commissionRate = Number(rateSetting?.value ?? 14.5);

  // 기간별 예상 수수료 = Σ광고비 × commission_rate
  const spendByPeriod = new Map<string, number>();
  for (const s of settlements ?? []) {
    spendByPeriod.set(s.period, (spendByPeriod.get(s.period) ?? 0) + s.ad_spend_total);
  }
  const receiptByPeriod = new Map<string, number>();
  for (const r of receipts ?? []) {
    receiptByPeriod.set(r.period, (receiptByPeriod.get(r.period) ?? 0) + r.amount);
  }

  const periods: string[] = [];
  let p = currentPeriodKst();
  for (let i = 0; i < 6; i += 1) {
    periods.push(p);
    p = prevPeriod(p);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">매체 입금 대사</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          매체 수수료 입금을 기록하고, 기간별 예상 수수료(광고비 × {commissionRate}%)와
          비교합니다. 대사 완료 체크는 정산 화면에서 건별로 합니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">기간</th>
              <th className="px-4 py-3 text-right font-medium">확정 광고비 합계</th>
              <th className="px-4 py-3 text-right font-medium">예상 수수료 ({commissionRate}%)</th>
              <th className="px-4 py-3 text-right font-medium">실입금 합계</th>
              <th className="px-4 py-3 text-right font-medium">차액</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {periods.map((pp) => {
              const spend = spendByPeriod.get(pp) ?? 0;
              const expected = Math.floor((spend * Math.round(commissionRate * 10)) / 1000);
              const received = receiptByPeriod.get(pp) ?? 0;
              const diff = received - expected;
              return (
                <tr key={pp} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{pp}</td>
                  <td className="px-4 py-3 text-right">{spend.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right">{expected.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right">{received.toLocaleString()}원</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      diff === 0 ? "text-muted-foreground" : diff > 0 ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {diff > 0 ? "+" : ""}
                    {diff.toLocaleString()}원
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ReceiptForm />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">입금 기록</h2>
        {(receipts ?? []).length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            기록이 없습니다
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">기간</th>
                  <th className="px-4 py-2.5 font-medium">매체</th>
                  <th className="px-4 py-2.5 text-right font-medium">입금액</th>
                  <th className="px-4 py-2.5 font-medium">입금일</th>
                  <th className="px-4 py-2.5 font-medium">메모</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(receipts ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5">{r.period}</td>
                    <td className="px-4 py-2.5 uppercase">{r.media}</td>
                    <td className="px-4 py-2.5 text-right">{r.amount.toLocaleString()}원</td>
                    <td className="px-4 py-2.5">{r.received_at ?? "-"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.memo ?? ""}</td>
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
