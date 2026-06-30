import Link from "next/link";
import { Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DateText } from "@/components/date-text";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";
import {
  REQUEST_MEDIA,
  requestDisplayTitle,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";

const MEDIA_LABEL = Object.fromEntries(REQUEST_MEDIA.map((m) => [m.value, m.label]));

export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const partnerId = await getCurrentPartnerId();

  const { data: notifications } = partnerId
    ? await supabase
        .from("rfp_notifications")
        .select("id, request_id, sent_at, opened_at")
        .eq("partner_id", partnerId)
        .order("sent_at", { ascending: false })
    : { data: [] };

  const requestIds = (notifications ?? []).map((n) => n.request_id);
  const { data: requests } = requestIds.length
    ? await supabase
        .from("matching_requests")
        .select("id, title, brief, budget_monthly, status")
        .in("id", requestIds)
    : { data: [] };
  const requestMap = new Map((requests ?? []).map((r) => [r.id, r]));

  // 내가 이미 지원한 요청
  const { data: myApps } = partnerId
    ? await supabase
        .from("applications")
        .select("request_id")
        .eq("partner_id", partnerId)
    : { data: [] };
  const appliedSet = new Set((myApps ?? []).map((a) => a.request_id));

  // 내가 후보로 선정된 건수
  const { count: candidateCount } = partnerId
    ? await supabase
        .from("candidates")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partnerId)
    : { count: 0 };

  const list = notifications ?? [];
  const appliedInList = list.filter((n) => appliedSet.has(n.request_id)).length;
  const summary = {
    rfp: list.length,
    applied: appliedSet.size,
    unapplied: list.length - appliedInList,
    candidate: candidateCount ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">도착한 RFP</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          광고주 매칭 요청을 확인하고 지원하세요.
        </p>
      </div>

      {list.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="도착한 RFP" value={summary.rfp} />
          <SummaryCard label="지원 완료" value={summary.applied} />
          <SummaryCard label="미지원" value={summary.unapplied} />
          <SummaryCard label="후보 선정" value={summary.candidate} />
        </div>
      ) : null}

      {list.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="잠시만 기다려주세요"
          description="새 매칭 요청이 들어오면 RFP가 도착합니다."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">브랜드 / 카테고리</th>
                <th className="px-4 py-3 font-medium">요청 매체</th>
                <th className="px-4 py-3 font-medium">월 예산</th>
                <th className="px-4 py-3 font-medium">도착</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((n) => {
                const r = requestMap.get(n.request_id);
                if (!r) return null;
                const brief = (r.brief ?? {}) as MatchingBrief;
                const channels = (brief.channels ?? []).slice(0, 3);
                const applied = appliedSet.has(n.request_id);
                return (
                  <tr key={n.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!n.opened_at && !applied ? (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        ) : null}
                        <div>
                          <div className="font-medium text-foreground">
                            {requestDisplayTitle(r.title, brief)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {brief.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {channels.map((c) => (
                          <Badge key={c} variant="muted">
                            {MEDIA_LABEL[c] ?? c}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.budget_monthly
                        ? `${r.budget_monthly.toLocaleString()}원`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <DateText value={n.sent_at} />
                    </td>
                    <td className="px-4 py-3">
                      {applied ? (
                        <Badge variant="success">지원 완료</Badge>
                      ) : (
                        <Badge variant="warning">미지원</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/partner/rfp/${n.request_id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        보기
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-secondary">{value}</div>
    </div>
  );
}
