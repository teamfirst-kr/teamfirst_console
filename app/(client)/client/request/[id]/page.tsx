import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { buildRequestTimeline } from "@/lib/timeline";
import { Timeline } from "@/components/timeline";
import {
  REQUEST_MEDIA,
  REQUEST_STATUS_LABEL,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";
import type { RequestStatus } from "@/types/database";

import { CandidateCards, type CandidateView } from "./candidate-cards";
import { CandidateScoreboard } from "./candidate-scoreboard";
import { SpendSection, type SpendRow } from "./spend-section";

const MEDIA_LABEL = Object.fromEntries(REQUEST_MEDIA.map((m) => [m.value, m.label]));

export const dynamic = "force-dynamic";

export default async function ClientRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("matching_requests")
    .select("id, title, brief, budget_monthly, status, submitted_at, created_at")
    .eq("id", id)
    .single();

  if (!request) notFound();

  // 후보 대행사 (candidates_sent 이후 노출)
  const { data: candidateRows } = await supabase
    .from("candidates")
    .select(
      "id, rank, partner_id, application_id, status, recommendation_reason, scores",
    )
    .eq("request_id", id)
    .order("rank", { ascending: true });

  const candAppIds = (candidateRows ?? []).map((c) => c.application_id);
  const candPartnerIds = (candidateRows ?? []).map((c) => c.partner_id);
  const [{ data: candApps }, { data: candPartners }] = await Promise.all([
    candAppIds.length
      ? supabase
          .from("applications")
          .select("id, proposal, quote_monthly, start_available")
          .in("id", candAppIds)
      : Promise.resolve({ data: [] as { id: string; proposal: unknown; quote_monthly: number | null; start_available: string | null }[] }),
    candPartnerIds.length
      ? supabase
          .from("partners")
          .select("id, company_name, specialty")
          .in("id", candPartnerIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string; specialty: string | null }[] }),
  ]);
  const appById = new Map((candApps ?? []).map((a) => [a.id, a]));
  const partnerById = new Map((candPartners ?? []).map((p) => [p.id, p]));

  // 분석권한 부여 현황 (candidate_id → platform[])
  const candidateIds = (candidateRows ?? []).map((c) => c.id);
  const { data: grants } = candidateIds.length
    ? await supabase
        .from("access_grants")
        .select("candidate_id, platform, grant_type, status")
        .in("candidate_id", candidateIds)
        .eq("grant_type", "analysis")
    : { data: [] as { candidate_id: string; platform: string; grant_type: string; status: string }[] };
  const grantsByCandidate = new Map<string, string[]>();
  for (const g of grants ?? []) {
    if (g.status === "revoked") continue;
    const list = grantsByCandidate.get(g.candidate_id) ?? [];
    list.push(g.platform);
    grantsByCandidate.set(g.candidate_id, list);
  }

  // 미팅 (candidate_id → meeting)
  const { data: meetingRows } = candidateIds.length
    ? await supabase
        .from("meetings")
        .select("candidate_id, status, proposed_slots, scheduled_at, meet_url")
        .in("candidate_id", candidateIds)
    : { data: [] as { candidate_id: string; status: string; proposed_slots: string[] | null; scheduled_at: string | null; meet_url: string | null }[] };
  const meetingByCandidate = new Map(
    (meetingRows ?? []).map((m) => [m.candidate_id, m]),
  );

  const candidates: CandidateView[] = (candidateRows ?? []).map((c) => {
    const app = appById.get(c.application_id);
    const proposal = (app?.proposal ?? {}) as {
      approach?: string;
      team_composition?: string | null;
      similar_cases?: string | null;
      differentiation?: string | null;
    };
    const partner = partnerById.get(c.partner_id);
    return {
      id: c.id,
      rank: c.rank,
      partnerName: partner?.company_name ?? "대행사",
      specialty: partner?.specialty ?? null,
      status: c.status,
      recommendationReason: c.recommendation_reason,
      approach: proposal.approach ?? "",
      teamComposition: proposal.team_composition ?? null,
      similarCases: proposal.similar_cases ?? null,
      differentiation: proposal.differentiation ?? null,
      quote: app?.quote_monthly ?? null,
      startAvailable: app?.start_available ?? null,
      grantedPlatforms: grantsByCandidate.get(c.id) ?? [],
      meeting: (() => {
        const m = meetingByCandidate.get(c.id);
        if (!m) return null;
        return {
          status: m.status,
          proposedSlots: m.proposed_slots ?? [],
          scheduledAt: m.scheduled_at,
          meetUrl: m.meet_url,
        };
      })(),
      scores: (c.scores ?? null) as Record<string, number> | null,
    };
  });

  // 광고비 신고 이력
  const { data: spendRows } = await supabase
    .from("ad_spend_history")
    .select("period_yearmonth, platform_amounts")
    .eq("request_id", id);
  const spend: SpendRow[] = (spendRows ?? []).map((s) => ({
    period: s.period_yearmonth,
    amounts: (s.platform_amounts ?? {}) as Record<string, number>,
  }));

  const timeline = await buildRequestTimeline(id);

  const brief = (request.brief ?? {}) as MatchingBrief;
  const status = request.status as RequestStatus;
  const statusBadge = REQUEST_STATUS_LABEL[status] ?? {
    label: status,
    variant: "muted" as const,
  };

  return (
    <div className="space-y-6">
      {created ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          매칭 요청이 제출되었습니다. 운영팀 검토 후 검증된 대행사에게 RFP가
          발송됩니다.
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/client/dashboard"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 대시보드
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-secondary">
            {request.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {brief.category} · 제출{" "}
            {request.submitted_at
              ? format(new Date(request.submitted_at), "yyyy.MM.dd")
              : format(new Date(request.created_at), "yyyy.MM.dd")}
          </p>
        </div>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>진행 타임라인</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={timeline} />
        </CardContent>
      </Card>

      <CandidateScoreboard candidates={candidates} />

      <CandidateCards requestId={request.id} candidates={candidates} />

      <SpendSection requestId={request.id} existing={spend} />

      <Card>
        <CardHeader>
          <CardTitle>요청 개요</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Field label="상호 (사업자명)" value={brief.company_name} />
          <Field label="사업자등록번호" value={brief.biz_reg_no} />
          <Field label="대표자명" value={brief.representative} />
          <Field label="담당자" value={brief.contact_name} />
          <Field label="담당자 직책" value={brief.contact_title} />
          <Field label="연락처" value={brief.phone} />
          <Field label="이메일" value={brief.email} />
          <Field
            label="홈페이지"
            value={
              brief.website ? (
                <a
                  href={brief.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {brief.website}
                </a>
              ) : null
            }
          />
          <Field
            label="월 예산"
            value={
              request.budget_monthly
                ? `${request.budget_monthly.toLocaleString()}원`
                : null
            }
          />
          <Field label="희망 대행 기간" value={brief.duration} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>브리프</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Block label="주력 제품 / 서비스" value={brief.product_intro} />
          <Block label="신규 대행사 모집 이유" value={brief.reason} />
          <TagRow label="마케팅 목표" values={brief.marketing_goals} />
          <TagRow
            label="요청 매체"
            values={brief.channels?.map((c) => MEDIA_LABEL[c] ?? c)}
          />
          <TagRow label="중요 KPI" values={brief.kpis} />
          <TagRow label="리포트 주기" values={brief.report_cycles} />
          <TagRow label="미팅 주기" values={brief.meeting_cycles} />
          <TagRow label="운영 툴" values={brief.tools} />
          <TagRow label="희망 계약 방식" values={brief.payment_methods} />
          <Block label="희망 대행사 기준" value={brief.preferred_agency} />
          <Block label="비희망 대행사 특징" value={brief.avoided_agency} />
        </CardContent>
      </Card>
    </div>
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
