import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";

import {
  InvoiceProfileForm,
  type InvoiceProfileValues,
} from "./invoice-profile-form";

export const dynamic = "force-dynamic";

const SETTLEMENT_LABEL: Record<
  string,
  { label: string; variant: "default" | "warning" | "success" | "muted" }
> = {
  pending: { label: "정산 대기", variant: "warning" },
  invoiced: { label: "계산서 발행", variant: "default" },
  paid: { label: "입금 완료", variant: "success" },
  cancelled: { label: "취소", variant: "muted" },
};

// 팀퍼스트 계좌 (운영 환경 변수에서 받거나 운영팀에서 직접 수정).
const TEAMFIRST_BANK = {
  bank: "신한은행",
  number: "100-035-XXXXXX",
  holder: "(주)팀퍼스트",
};

export default async function PartnerSettlementsPage() {
  const supabase = await createClient();
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) return null;

  const { data: deals } = await supabase
    .from("deals")
    .select(
      "id, request_id, status, contracted_at, activated_at, partner_fee_rate, teamfirst_share_rate",
    )
    .eq("partner_id", partnerId)
    .order("contracted_at", { ascending: false });

  const dealIds = (deals ?? []).map((d) => d.id);
  const requestIds = (deals ?? []).map((d) => d.request_id);
  const safeDealIds = dealIds.length
    ? dealIds
    : ["00000000-0000-0000-0000-000000000000"];
  const safeRequestIds = requestIds.length
    ? requestIds
    : ["00000000-0000-0000-0000-000000000000"];

  const { data: requests } = await supabase
    .from("matching_requests")
    .select("id, title")
    .in("id", safeRequestIds);
  const requestTitle = new Map((requests ?? []).map((r) => [r.id, r.title]));

  const { data: settlements } = await supabase
    .from("settlements")
    .select(
      "id, deal_id, yearmonth, total_spend, partner_fee, teamfirst_share, status, invoiced_at, paid_at",
    )
    .in("deal_id", safeDealIds)
    .order("yearmonth", { ascending: false });

  const { data: profileRow } = await supabase
    .from("partner_invoice_profiles")
    .select(
      "company_name, biz_reg_no, representative, address, business_type, business_item, invoice_email, contact_name, contact_phone",
    )
    .eq("partner_id", partnerId)
    .maybeSingle();

  const profile: InvoiceProfileValues | null = profileRow
    ? (profileRow as InvoiceProfileValues)
    : null;

  const totalDue = (settlements ?? [])
    .filter((s) => s.status === "pending" || s.status === "invoiced")
    .reduce((sum, s) => sum + (s.teamfirst_share ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">정산 / 계산서</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          매칭 성사된 계약의 월별 정산 내역과 결제 정보를 확인하고, 세금계산서
          발행정보를 관리하세요.
        </p>
      </div>

      {/* 미입금 잔액 */}
      <Card>
        <CardHeader>
          <CardTitle>미정산 합계</CardTitle>
          <CardDescription>
            팀퍼스트가 받을 정산 잔액 (계산서 발행 대기 + 입금 대기).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-end justify-between gap-4">
          <div className="text-3xl font-bold text-primary">
            {totalDue.toLocaleString()}원
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="text-xs text-muted-foreground">입금 계좌</div>
            <div className="font-medium text-foreground">
              {TEAMFIRST_BANK.bank} {TEAMFIRST_BANK.number}
            </div>
            <div className="text-xs text-muted-foreground">
              예금주 {TEAMFIRST_BANK.holder}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 계약 목록 + 월별 정산 */}
      <Card>
        <CardHeader>
          <CardTitle>매칭 성사 계약</CardTitle>
          <CardDescription>
            가계약 · 진계약(매체 이관 완료) 상태와 월별 정산 내역.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {(!deals || deals.length === 0) ? (
            <div className="p-6">
              <EmptyState
                title="아직 성사된 계약이 없습니다"
                description="대행 계약이 체결되면 여기에서 월별 정산을 확인할 수 있습니다."
              />
            </div>
          ) : (
            <div className="divide-y">
              {deals.map((d) => {
                const dealSettlements = (settlements ?? []).filter(
                  (s) => s.deal_id === d.id,
                );
                return (
                  <div key={d.id} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">
                          {requestTitle.get(d.request_id) ?? "RFP"}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {d.contracted_at
                            ? `가계약 ${format(new Date(d.contracted_at), "yyyy.MM.dd", { locale: ko })}`
                            : null}
                          {d.activated_at
                            ? ` · 진계약 ${format(new Date(d.activated_at), "yyyy.MM.dd", { locale: ko })}`
                            : null}
                          {d.partner_fee_rate
                            ? ` · 대행 수수료율 ${d.partner_fee_rate}%`
                            : null}
                          {d.teamfirst_share_rate
                            ? ` · 팀퍼스트 몫 ${d.teamfirst_share_rate}%`
                            : null}
                        </div>
                      </div>
                      <Badge
                        variant={d.status === "active" ? "success" : "default"}
                      >
                        {d.status === "active"
                          ? "진계약 운영중"
                          : d.status === "contracted"
                            ? "가계약"
                            : d.status === "ended"
                              ? "종료"
                              : d.status}
                      </Badge>
                    </div>

                    {dealSettlements.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        아직 발생한 월별 정산이 없습니다.
                      </p>
                    ) : (
                      <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2 font-medium">월</th>
                              <th className="px-3 py-2 font-medium">총 광고비</th>
                              <th className="px-3 py-2 font-medium">대행 수수료</th>
                              <th className="px-3 py-2 font-medium">팀퍼스트 정산액</th>
                              <th className="px-3 py-2 font-medium">상태</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {dealSettlements.map((s) => {
                              const sb = SETTLEMENT_LABEL[s.status] ?? {
                                label: s.status,
                                variant: "muted" as const,
                              };
                              return (
                                <tr key={s.id}>
                                  <td className="px-3 py-2 font-medium">
                                    {s.yearmonth}
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {s.total_spend?.toLocaleString() ?? "-"}원
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {s.partner_fee?.toLocaleString() ?? "-"}원
                                  </td>
                                  <td className="px-3 py-2 font-medium text-primary">
                                    {s.teamfirst_share?.toLocaleString() ?? "-"}원
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge variant={sb.variant}>
                                      {sb.label}
                                    </Badge>
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
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 세금계산서 발행정보 */}
      <Card>
        <CardHeader>
          <CardTitle>세금계산서 발행정보</CardTitle>
          <CardDescription>
            입력하신 정보로 팀퍼스트가 세금계산서를 발행합니다. 변경 시 즉시
            반영됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceProfileForm initial={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
