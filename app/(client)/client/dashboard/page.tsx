import Link from "next/link";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import {
  REQUEST_STATUS_LABEL,
  requestDisplayTitle,
} from "@/lib/schemas/matching-request";
import type { RequestStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = new Set<string>([
  "submitted",
  "rfp_sent",
  "collecting",
  "curating",
  "candidates_sent",
  "meeting_scheduled",
]);

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("matching_requests")
    .select("id, title, brief, budget_monthly, status, submitted_at, created_at")
    .order("created_at", { ascending: false });

  const list = requests ?? [];
  const summary = {
    active: list.filter((r) => ACTIVE_STATUSES.has(r.status)).length,
    collecting: list.filter((r) => r.status === "collecting").length,
    meeting: list.filter((r) => r.status === "meeting_scheduled").length,
    won: list.filter((r) => r.status === "closed_won").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">광고주 대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            매칭 요청 현황을 확인하세요.
          </p>
        </div>
        <Button asChild>
          <Link href="/client/request/new">
            <Plus className="h-4 w-4" /> 새 매칭 요청
          </Link>
        </Button>
      </div>

      {list.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="진행 중" value={summary.active} />
          <SummaryCard label="지원 수집 중" value={summary.collecting} />
          <SummaryCard label="미팅 예정" value={summary.meeting} />
          <SummaryCard label="완료 (성사)" value={summary.won} />
        </div>
      ) : null}

      {list.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="아직 매칭 요청이 없습니다"
          description="첫 매칭 요청을 작성하시면 검증된 파트너 대행사에게 RFP가 발송됩니다."
          action={
            <Button asChild>
              <Link href="/client/request/new">새 매칭 요청 작성</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">월 예산</th>
                <th className="px-4 py-3 font-medium">제출일</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((r) => {
                const badge = REQUEST_STATUS_LABEL[r.status as RequestStatus] ?? {
                  label: r.status,
                  variant: "muted" as const,
                };
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {requestDisplayTitle(
                        r.title,
                        r.brief as {
                          brand_name?: string | null;
                          category?: string | null;
                        } | null,
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.budget_monthly
                        ? `${r.budget_monthly.toLocaleString()}원`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.submitted_at
                        ? format(new Date(r.submitted_at), "yyyy.MM.dd")
                        : format(new Date(r.created_at), "yyyy.MM.dd")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/client/request/${r.id}`}
                        className="inline-flex items-center rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:bg-muted hover:text-primary"
                      >
                        상세 보기
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
