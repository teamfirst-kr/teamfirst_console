import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";
import {
  REQUEST_MEDIA,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";

import { MeetingResponse } from "./meeting-response";

const MEDIA_LABEL = Object.fromEntries(REQUEST_MEDIA.map((m) => [m.value, m.label]));

export const dynamic = "force-dynamic";

export default async function PartnerRfpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) redirect("/partner/dashboard");

  // 본인에게 발송된 RFP인지 확인
  const { data: notification } = await supabase
    .from("rfp_notifications")
    .select("id, opened_at")
    .eq("request_id", id)
    .eq("partner_id", partnerId)
    .maybeSingle();

  if (!notification) notFound();

  // 최초 열람 기록
  if (!notification.opened_at) {
    await supabase
      .from("rfp_notifications")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", notification.id);
  }

  const { data: request } = await supabase
    .from("matching_requests")
    .select("id, title, brief, budget_monthly, status, submitted_at, created_at")
    .eq("id", id)
    .single();

  if (!request) notFound();

  const { data: myApp } = await supabase
    .from("applications")
    .select("id, status")
    .eq("request_id", id)
    .eq("partner_id", partnerId)
    .maybeSingle();

  // 내 후보 + 미팅
  const { data: myCandidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("request_id", id)
    .eq("partner_id", partnerId)
    .maybeSingle();
  const { data: meeting } = myCandidate
    ? await supabase
        .from("meetings")
        .select("id, status, proposed_slots, scheduled_at, meet_url")
        .eq("candidate_id", myCandidate.id)
        .maybeSingle()
    : { data: null };

  const brief = (request.brief ?? {}) as MatchingBrief;
  const plannedBudgets = brief.planned_budgets ?? {};
  const hasPlanned = Object.keys(plannedBudgets).length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/partner/dashboard"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← RFP 목록
        </Link>
        <Link
          href={`/rfp/${id}/print`}
          className="text-sm font-medium text-primary hover:underline"
        >
          RFP PDF 보기 →
        </Link>
      </div>

      {meeting ? (
        <MeetingResponse
          meetingId={meeting.id}
          requestId={id}
          status={meeting.status}
          proposedSlots={meeting.proposed_slots ?? []}
          scheduledAt={meeting.scheduled_at}
          meetUrl={meeting.meet_url}
        />
      ) : null}

      {/* 1. 표지 */}
      <div className="rounded-xl bg-secondary p-8 text-secondary-foreground">
        <div className="text-xs font-bold tracking-widest text-white/50">
          TEAM FIRST · AGENCY MATCHING RFP
        </div>
        <p className="mt-6 text-sm text-white/70">{brief.brand_name}</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight">
          광고대행 제안요청서
        </h1>
        <div className="mt-6 flex items-center gap-2">
          <Badge variant="muted">{brief.category}</Badge>
          <span className="text-xs text-white/50">
            발행일자{" "}
            {format(
              new Date(request.submitted_at ?? request.created_at ?? Date.now()),
              "yyyy.MM.dd",
            )}
          </span>
        </div>
      </div>

      {/* 2. 브랜드 & 서비스 소개 */}
      <Section title="브랜드 및 서비스 소개">
        <Field label="브랜드" value={brief.brand_name} />
        <Field label="카테고리" value={brief.category} />
        <Field
          label="Website"
          value={
            brief.website ? (
              <a
                href={brief.website}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline break-all"
              >
                {brief.website}
              </a>
            ) : null
          }
        />
        <Block label="브랜드 소개" value={brief.product_intro} />
      </Section>

      {/* 3. 프로젝트 배경 및 예산 */}
      <Section title="프로젝트 배경 및 예산">
        <Block label="모집 배경" value={brief.reason} />
        <Field label="계약 기간" value={brief.duration} />
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">
            집행 예정 월평균 광고예산
          </div>
          {hasPlanned ? (
            <div className="space-y-1">
              {Object.entries(plannedBudgets).map(([k, v]) => (
                <div key={k} className="flex justify-between max-w-xs">
                  <span className="text-muted-foreground">
                    {MEDIA_LABEL[k] ?? k}
                  </span>
                  <span className="font-medium text-foreground">
                    {Number(v).toLocaleString()}원
                  </span>
                </div>
              ))}
              {request.budget_monthly ? (
                <div className="flex justify-between max-w-xs border-t pt-1 mt-1">
                  <span className="font-medium">합계</span>
                  <span className="font-bold text-primary">
                    {request.budget_monthly.toLocaleString()}원
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-foreground">
              {request.budget_monthly
                ? `${request.budget_monthly.toLocaleString()}원`
                : "협의"}
            </p>
          )}
        </div>
      </Section>

      {/* 4. 마케팅 목표 및 KPI */}
      <Section title="마케팅 목표 및 KPI">
        <TagRow label="최우선 마케팅 목표" values={brief.marketing_goals} />
        <TagRow label="핵심 성과 지표 (KPI)" values={brief.kpis} />
      </Section>

      {/* 5. 대행 범위 및 필수 운영 툴 */}
      <Section title="대행 범위 및 필수 운영 툴">
        <TagRow
          label="요청 매체 & 마케팅 영역"
          values={brief.channels?.map((c) => MEDIA_LABEL[c] ?? c)}
        />
        <Field
          label="성과조회 권한"
          value={
            brief.analysis_access_intent
              ? "미팅 전 데이터 분석을 위한 성과조회 권한 부여 가능"
              : "미정 (협의)"
          }
        />
        <TagRow label="필수 운영 툴" values={brief.tools} />
      </Section>

      {/* 6. 커뮤니케이션 요청 */}
      <Section title="커뮤니케이션 요청">
        <TagRow label="리포트 주기" values={brief.report_cycles} />
        <TagRow label="미팅 주기" values={brief.meeting_cycles} />
      </Section>

      {/* 7. 파트너사 요건 및 계약 */}
      <Section title="파트너사 요건 및 계약">
        <Block label="매칭 희망 파트너" value={brief.preferred_agency} />
        <Block
          label="매칭 지양 파트너"
          value={brief.avoided_agency || "해당 없음"}
        />
        <TagRow label="계약 방식" values={brief.payment_methods} />
      </Section>

      {/* 8. 지원 CTA */}
      <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
        {myApp ? (
          <>
            <p className="text-lg font-bold text-secondary">지원 완료</p>
            <p className="mt-1 text-sm text-muted-foreground">
              이미 이 RFP에 지원하셨습니다. 운영팀의 검토 결과를 기다려주세요.
            </p>
            <Badge variant="success" className="mt-3">
              제출됨
            </Badge>
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-secondary">
              이 프로젝트에 제안하시겠습니까?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              제안 의사가 있으시면 아래 버튼으로 지원서를 제출해주세요.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link href={`/partner/rfp/${id}/apply`}>이 RFP에 지원하기</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="inline-block h-4 w-1 rounded bg-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">{children}</CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-foreground">{value || "-"}</div>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <p className="whitespace-pre-wrap text-foreground">{value || "-"}</p>
    </div>
  );
}

function TagRow({ label, values }: { label: string; values?: string[] }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1">
        {!values || values.length === 0 ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          values.map((v) => (
            <Badge key={v} variant="muted">
              {v}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
