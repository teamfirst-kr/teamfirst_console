import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { PartnerStatus, RequestStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 모든 카운트는 서로 독립 → 한 번에 병렬 실행 (12회 왕복 → 1회 대기)
  const partnerCount = (status: PartnerStatus) =>
    supabase
      .from("partners")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
  const requestCount = (statuses: RequestStatus[]) =>
    supabase
      .from("matching_requests")
      .select("id", { count: "exact", head: true })
      .in("status", statuses);

  const STAGES: { label: string; statuses: RequestStatus[] }[] = [
    { label: "검수 대기", statuses: ["submitted"] },
    { label: "RFP·수집", statuses: ["rfp_sent", "collecting"] },
    { label: "후보 선정", statuses: ["curating", "candidates_sent"] },
    { label: "미팅", statuses: ["meeting_scheduled"] },
    { label: "성사", statuses: ["closed_won"] },
  ];

  const [
    { count: pendingCount },
    { count: reviewingCount },
    { count: contractedCount },
    { count: submittedReq },
    { count: activeReq },
    { count: meetingReq },
    { count: settlementPending },
    ...stageResults
  ] = await Promise.all([
    partnerCount("pending"),
    partnerCount("reviewing"),
    partnerCount("contracted"),
    requestCount(["submitted"]),
    requestCount(["rfp_sent", "collecting", "curating", "candidates_sent"]),
    requestCount(["meeting_scheduled"]),
    supabase
      .from("settlements")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "invoiced"]),
    ...STAGES.map((s) => requestCount(s.statuses)),
  ]);

  const stageCounts = STAGES.map((s, i) => ({
    label: s.label,
    count: stageResults[i]?.count ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary">운영자 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          입점·매칭·미팅·계약을 한 화면에서 관리하세요.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          파트너 입점
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="신청 대기"
          value={String(pendingCount ?? 0)}
          hint="신규 검토 필요"
          href="/admin/partners?status=pending"
        />
        <StatCard
          label="검토/계약 중"
          value={String(reviewingCount ?? 0)}
          hint="계약서 발송 또는 응답 대기"
          href="/admin/partners?status=reviewing"
        />
        <StatCard
          label="입점 완료"
          value={String(contractedCount ?? 0)}
          hint="활성 파트너"
          href="/admin/partners?status=contracted"
        />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          매칭 진행
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="검수 대기 요청"
            value={String(submittedReq ?? 0)}
            hint="RFP 발송 필요"
            href="/admin/requests?status=submitted"
          />
          <StatCard
            label="진행 중 매칭"
            value={String(activeReq ?? 0)}
            hint="RFP~후보 선정"
            href="/admin/requests?view=board"
          />
          <StatCard
            label="미팅 예정"
            value={String(meetingReq ?? 0)}
            hint="일정 확정/조율"
            href="/admin/meetings"
          />
          <StatCard
            label="정산 대기"
            value={String(settlementPending ?? 0)}
            hint="발행/입금 대기"
            href="/admin/settlements"
          />
        </div>
      </div>

      {/* 파이프라인 퍼널 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            매칭 파이프라인
          </h2>
          <Link
            href="/admin/requests?view=board"
            className="text-xs font-medium text-primary hover:underline"
          >
            보드에서 보기 →
          </Link>
        </div>
        <Link
          href="/admin/requests?view=board"
          className="flex flex-wrap items-stretch gap-2 rounded-xl border bg-card p-3 shadow-sm"
        >
          {stageCounts.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center gap-2">
              <div className="flex-1 rounded-lg bg-muted/60 px-3 py-3 text-center">
                <div className="text-2xl font-bold text-secondary">
                  {s.count}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {s.label}
                </div>
              </div>
              {i < stageCounts.length - 1 ? (
                <span className="text-muted-foreground/50">›</span>
              ) : null}
            </div>
          ))}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>오늘의 할 일</CardTitle>
          <CardDescription>
            신청 대기 건이 있다면 우선 처리해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {pendingCount && pendingCount > 0 ? (
            <Link
              href="/admin/partners?status=pending"
              className="text-primary hover:underline"
            >
              신청 대기 {pendingCount}건 처리하기 →
            </Link>
          ) : (
            "현재 처리 대기 중인 항목이 없습니다."
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  href?: string;
}) {
  const body = (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm transition hover:shadow-md">
      <div className="bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
        {label}
      </div>
      <div className="px-4 py-5">
        <p className="text-3xl font-bold text-secondary">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
