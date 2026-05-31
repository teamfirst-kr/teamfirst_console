import Link from "next/link";
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
import { APPLICATION_STATUS_LABEL } from "@/lib/schemas/rfp-application";
import type { MatchingBrief } from "@/lib/schemas/matching-request";

export const dynamic = "force-dynamic";

type AppStatus = keyof typeof APPLICATION_STATUS_LABEL;

export default async function PartnerMatchingsPage() {
  const supabase = await createClient();
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) return null;

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, request_id, status, submitted_at, quote_monthly, start_available",
    )
    .eq("partner_id", partnerId)
    .order("submitted_at", { ascending: false });

  const requestIds = (applications ?? []).map((a) => a.request_id);
  const safeIds = requestIds.length
    ? requestIds
    : ["00000000-0000-0000-0000-000000000000"];

  const { data: requests } = await supabase
    .from("matching_requests")
    .select("id, title, brief, status, budget_monthly")
    .in("id", safeIds);
  const requestMap = new Map((requests ?? []).map((r) => [r.id, r]));

  const { data: candidateRows } = await supabase
    .from("candidates")
    .select("request_id, rank, status")
    .eq("partner_id", partnerId)
    .in("request_id", safeIds);
  const candByRequest = new Map(
    (candidateRows ?? []).map((c) => [c.request_id, c]),
  );

  const { data: deals } = await supabase
    .from("deals")
    .select("request_id, status, contracted_at, activated_at")
    .eq("partner_id", partnerId)
    .in("request_id", safeIds);
  const dealByRequest = new Map((deals ?? []).map((d) => [d.request_id, d]));

  const list = applications ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">내 매칭 이력</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          지원한 RFP 전체 목록과 매칭 결과(후보 선정 · 미팅 · 계약)를 확인합니다.
        </p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="아직 지원한 RFP가 없습니다"
          description="도착한 RFP에서 관심 있는 광고주에게 지원해보세요."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>지원 건수 {list.length}건</CardTitle>
            <CardDescription>최근 지원 순으로 정렬됩니다.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">브랜드 / RFP</th>
                    <th className="px-4 py-3 font-medium">지원일</th>
                    <th className="px-4 py-3 font-medium">월 견적</th>
                    <th className="px-4 py-3 font-medium">지원 상태</th>
                    <th className="px-4 py-3 font-medium">후보 / 미팅</th>
                    <th className="px-4 py-3 font-medium">계약</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {list.map((a) => {
                    const r = requestMap.get(a.request_id);
                    const brief = (r?.brief ?? {}) as MatchingBrief;
                    const appStatus = a.status as AppStatus;
                    const appBadge =
                      APPLICATION_STATUS_LABEL[appStatus] ?? {
                        label: appStatus,
                        variant: "muted" as const,
                      };
                    const cand = candByRequest.get(a.request_id);
                    const deal = dealByRequest.get(a.request_id);

                    let candText = "-";
                    let candVariant:
                      | "default"
                      | "warning"
                      | "success"
                      | "muted"
                      | "destructive" = "muted";
                    if (cand) {
                      candText = `${cand.rank}순위`;
                      candVariant = "default";
                      if (cand.status === "interested") {
                        candText += " · 광고주 관심";
                        candVariant = "success";
                      } else if (cand.status === "meeting_set") {
                        candText += " · 미팅 확정";
                        candVariant = "success";
                      } else if (cand.status === "declined_by_client") {
                        candText += " · 광고주 미선택";
                        candVariant = "muted";
                      }
                    }

                    return (
                      <tr key={a.id} className="hover:bg-muted/30 align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {brief.brand_name ?? r?.title ?? "-"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {brief.category}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(a.submitted_at), "yyyy.MM.dd", {
                            locale: ko,
                          })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {a.quote_monthly
                            ? `${a.quote_monthly.toLocaleString()}원`
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={appBadge.variant}>
                            {appBadge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={candVariant}>{candText}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {deal ? (
                            <Badge
                              variant={
                                deal.status === "active"
                                  ? "success"
                                  : "default"
                              }
                            >
                              {deal.status === "active"
                                ? "진계약 (운영중)"
                                : deal.status === "contracted"
                                  ? "가계약"
                                  : deal.status}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/partner/rfp/${a.request_id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            RFP 보기
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
