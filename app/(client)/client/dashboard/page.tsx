import Link from "next/link";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { REQUEST_STATUS_LABEL } from "@/lib/schemas/matching-request";
import type { RequestStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("matching_requests")
    .select("id, title, budget_monthly, status, submitted_at, created_at")
    .order("created_at", { ascending: false });

  const list = requests ?? [];

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
                      {r.title}
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
