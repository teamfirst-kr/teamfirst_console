import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import {
  MARKETER_CATEGORY_LABEL,
  MARKETER_REQUEST_STATUS_LABEL,
  type MarketerRequestRow,
} from "@/lib/schemas/marketer";

export const dynamic = "force-dynamic";

export default async function AdminMarketerRequestsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketer_requests")
    .select(
      "id, client_id, brand_name, category, budget_range, goal, message, status, assigned_marketer_id, interview_at, admin_notes, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  const requests = (error ? [] : ((data ?? []) as MarketerRequestRow[]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">마케터 매칭 신청</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          브랜드 신청을 검토하고 적합 마케터를 제안·인터뷰·확정 처리하세요.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          marketer_requests 테이블을 찾을 수 없습니다. 마이그레이션 012를 먼저
          실행해주세요.
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="신청이 없습니다"
          description="브랜드가 마케터 매칭을 신청하면 여기에 표시됩니다."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">브랜드</th>
                <th className="px-4 py-3 font-medium">분야</th>
                <th className="px-4 py-3 font-medium">신청</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((r) => {
                const badge = MARKETER_REQUEST_STATUS_LABEL[r.status] ?? {
                  label: r.status,
                  variant: "muted" as const,
                };
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {r.brand_name}
                      </div>
                      {r.goal ? (
                        <div className="text-xs text-muted-foreground">
                          {r.goal}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">
                        {MARKETER_CATEGORY_LABEL[r.category] ?? r.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/marketer-requests/${r.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        관리
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
