import Link from "next/link";
import { format } from "date-fns";

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
import { getCurrentMarketerId } from "@/lib/auth";
import {
  MARKETER_CATEGORY_LABEL,
  MARKETER_REQUEST_STATUS_LABEL,
  type MarketerRequestRow,
  type MarketerRow,
} from "@/lib/schemas/marketer";

export const dynamic = "force-dynamic";

export default async function MarketerDashboardPage() {
  const supabase = await createClient();
  const marketerId = await getCurrentMarketerId();

  const { data: profile } = marketerId
    ? await supabase
        .from("marketers")
        .select(
          "id, slug, display_name, category, headline, status, contact_email, user_id, cohort_year, career_years, bio, skills, portfolio, avatar_url, sort_order, created_at, updated_at",
        )
        .eq("id", marketerId)
        .maybeSingle()
    : { data: null };
  const me = profile as MarketerRow | null;

  const { data: reqRows } = marketerId
    ? await supabase
        .from("marketer_requests")
        .select(
          "id, client_id, brand_name, category, budget_range, goal, message, status, assigned_marketer_id, interview_at, admin_notes, created_at, updated_at",
        )
        .eq("assigned_marketer_id", marketerId)
        .order("created_at", { ascending: false })
    : { data: [] };
  const requests = (reqRows ?? []) as MarketerRequestRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">마케터 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          제안받은 매칭과 인터뷰 일정을 확인하세요.
        </p>
      </div>

      {me ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {me.display_name}
              <Badge variant="muted">
                {MARKETER_CATEGORY_LABEL[me.category] ?? me.category}
              </Badge>
              {me.status === "published" ? (
                <Badge variant="success">공개 중</Badge>
              ) : (
                <Badge variant="warning">비공개</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {me.headline || "프로필에서 한 줄 소개를 작성해보세요."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/marketer-console/profile"
              className="font-medium text-primary hover:underline"
            >
              프로필 수정 →
            </Link>
            {me.status === "published" ? (
              <Link
                href={`/marketers/${me.slug}`}
                target="_blank"
                className="font-medium text-primary hover:underline"
              >
                공개 페이지 보기 ↗
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>제안받은 매칭 ({requests.length})</CardTitle>
          <CardDescription>
            운영팀이 회원님을 제안한 브랜드 매칭입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <EmptyState
              title="아직 제안받은 매칭이 없습니다"
              description="운영팀이 적합한 브랜드에 회원님을 제안하면 여기에 표시됩니다."
            />
          ) : (
            <div className="space-y-3">
              {requests.map((r) => {
                const badge = MARKETER_REQUEST_STATUS_LABEL[r.status] ?? {
                  label: r.status,
                  variant: "muted" as const,
                };
                return (
                  <div key={r.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {r.brand_name}
                      </span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                      {r.goal ? <div>목표: {r.goal}</div> : null}
                      {r.budget_range ? <div>예산: {r.budget_range}</div> : null}
                      {r.interview_at ? (
                        <div>
                          인터뷰:{" "}
                          <span className="font-medium text-foreground">
                            {format(new Date(r.interview_at), "yyyy.MM.dd HH:mm")}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
