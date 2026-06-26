import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import {
  MARKETER_CATEGORY_LABEL,
  MARKETER_REQUEST_STATUS_LABEL,
  type MarketerRequestRow,
  type MarketerRow,
} from "@/lib/schemas/marketer";

export const dynamic = "force-dynamic";

export default async function ClientMarketerRequestsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketer_requests")
    .select(
      "id, client_id, brand_name, category, budget_range, goal, message, status, assigned_marketer_id, interview_at, admin_notes, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  const requests = (error ? [] : ((data ?? []) as MarketerRequestRow[]));

  // 제안된 마케터 이름 매핑
  const marketerIds = requests
    .map((r) => r.assigned_marketer_id)
    .filter((v): v is string => !!v);
  const marketerName = new Map<string, string>();
  if (marketerIds.length) {
    const { data: ms } = await supabase
      .from("marketers")
      .select("id, display_name, slug")
      .in("id", marketerIds);
    for (const m of (ms ?? []) as Pick<MarketerRow, "id" | "display_name" | "slug">[]) {
      marketerName.set(m.id, m.display_name);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">마케터 매칭</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            신청한 마케터 매칭의 진행 상황입니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/marketer-matching/apply">+ 마케터 매칭 신청</Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="신청한 마케터 매칭이 없습니다"
          description="필요한 분야의 검증된 마케터를 매칭받아보세요."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const badge = MARKETER_REQUEST_STATUS_LABEL[r.status] ?? {
              label: r.status,
              variant: "muted" as const,
            };
            return (
              <div key={r.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {r.brand_name}
                    </span>
                    <Badge variant="muted">
                      {MARKETER_CATEGORY_LABEL[r.category] ?? r.category}
                    </Badge>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                  {r.goal ? <div>목표: {r.goal}</div> : null}
                  {r.budget_range ? <div>예산: {r.budget_range}</div> : null}
                  {r.assigned_marketer_id ? (
                    <div>
                      제안 마케터:{" "}
                      <span className="font-medium text-foreground">
                        {marketerName.get(r.assigned_marketer_id) ?? "배정됨"}
                      </span>
                    </div>
                  ) : null}
                  {r.interview_at ? (
                    <div>
                      인터뷰:{" "}
                      <span className="font-medium text-foreground">
                        {format(new Date(r.interview_at), "yyyy.MM.dd HH:mm")}
                      </span>
                    </div>
                  ) : null}
                  <div className="text-xs">
                    신청일 {format(new Date(r.created_at), "yyyy.MM.dd")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
