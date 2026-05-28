import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import {
  REQUEST_MEDIA,
  REQUEST_STATUS_LABEL,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";
import type { RequestStatus } from "@/types/database";

const MEDIA_LABEL = Object.fromEntries(REQUEST_MEDIA.map((m) => [m.value, m.label]));

const STATUS_TABS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "submitted", label: "검수 대기" },
  { value: "rfp_sent", label: "RFP 발송" },
  { value: "collecting", label: "지원 수집" },
  { value: "curating", label: "후보 선정" },
  { value: "closed_won", label: "성사" },
];

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = (status ?? "all") as RequestStatus | "all";

  const supabase = await createClient();
  let query = supabase
    .from("matching_requests")
    .select("id, title, brief, budget_monthly, status, submitted_at, created_at")
    .order("created_at", { ascending: false });
  if (activeStatus !== "all") query = query.eq("status", activeStatus);

  const { data, error } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">매칭 요청</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          광고주 요청을 검수하고 RFP 발송을 진행하세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          const href =
            tab.value === "all"
              ? "/admin/requests"
              : `/admin/requests?status=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={
                isActive
                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  : "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          요청 목록을 불러오지 못했습니다: {error.message}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="해당 상태의 요청이 없습니다"
          description="광고주가 매칭 요청을 제출하면 여기에 표시됩니다."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">브랜드 / 카테고리</th>
                <th className="px-4 py-3 font-medium">요청 매체</th>
                <th className="px-4 py-3 font-medium">월 예산</th>
                <th className="px-4 py-3 font-medium">제출</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((r) => {
                const brief = (r.brief ?? {}) as MatchingBrief;
                const badge = REQUEST_STATUS_LABEL[r.status as RequestStatus] ?? {
                  label: r.status,
                  variant: "muted" as const,
                };
                const channels = (brief.channels ?? []).slice(0, 3);
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {r.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {brief.category}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {channels.length === 0 ? (
                          <span className="text-xs text-muted-foreground">-</span>
                        ) : (
                          channels.map((c) => (
                            <Badge key={c} variant="muted">
                              {MEDIA_LABEL[c] ?? c}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.budget_monthly
                        ? `${r.budget_monthly.toLocaleString()}원`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.submitted_at
                        ? formatDistanceToNow(new Date(r.submitted_at), {
                            addSuffix: true,
                            locale: ko,
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/requests/${r.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        상세
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
