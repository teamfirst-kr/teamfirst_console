import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPbClientId } from "@/lib/auth";
import type { PbSettlementRow } from "@/types/database";

export const dynamic = "force-dynamic";

function statusBadge(s: PbSettlementRow): { label: string; variant: "default" | "muted" | "destructive" } {
  if (s.status === "paid") return { label: "지급 완료", variant: "default" };
  if (s.invoice_status === "overdue") return { label: "보류(계산서 미발행)", variant: "destructive" };
  if (s.status === "confirmed") {
    if (s.invoice_status === "pending") return { label: "계산서 대기", variant: "muted" };
    return { label: "지급 대기", variant: "muted" };
  }
  return { label: "산정 중", variant: "muted" };
}

export default async function PortalSettlementsPage() {
  const supabase = await createClient();
  const clientId = await getCurrentPbClientId();
  if (!clientId) return null;

  const { data } = await supabase
    .from("pb_monthly_settlements")
    .select("*")
    .eq("client_id", clientId)
    .in("status", ["confirmed", "paid"])
    .order("period", { ascending: false });
  const rows = (data ?? []) as PbSettlementRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">정산 내역</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          매월 확정된 페이백 정산서를 확인하고 세금계산서를 발행하세요.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          아직 확정된 정산이 없습니다. 활성화 월의 익월 초에 첫 정산서가 도착합니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">기간</th>
                <th className="px-4 py-3 text-right font-medium">광고비</th>
                <th className="px-4 py-3 text-right font-medium">적용 요율</th>
                <th className="px-4 py-3 text-right font-medium">페이백(공급가액)</th>
                <th className="px-4 py-3 text-right font-medium">VAT</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((s) => {
                const badge = statusBadge(s);
                return (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.period}</td>
                    <td className="px-4 py-3 text-right">
                      {s.ad_spend_total.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-right">{Number(s.applied_rate)}%</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {s.payback_supply.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.payback_vat.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/app/settlements/${s.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        정산서 보기 →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
