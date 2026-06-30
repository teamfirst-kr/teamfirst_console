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
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRequestTimeline } from "@/lib/timeline";
import { Timeline } from "@/components/timeline";
import {
  REQUEST_MEDIA,
  REQUEST_STATUS_LABEL,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";
import type { RequestStatus } from "@/types/database";

import { RfpPanel } from "./rfp-panel";
import { CandidateSelector, type ApplicantCard } from "./candidate-selector";
import { DecisionPanel, type DecisionCandidate } from "./decision-panel";

const MEDIA_LABEL = Object.fromEntries(REQUEST_MEDIA.map((m) => [m.value, m.label]));

export const dynamic = "force-dynamic";

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("matching_requests")
    .select("id, title, brief, budget_monthly, status, submitted_at, created_at, admin_memo")
    .eq("id", id)
    .single();

  if (!request) notFound();

  const timeline = await buildRequestTimeline(id);

  const brief = (request.brief ?? {}) as MatchingBrief;
  const status = request.status as RequestStatus;
  const badge = REQUEST_STATUS_LABEL[status] ?? {
    label: status,
    variant: "muted" as const,
  };

  // RFP 발송 대상: 입점 완료 대행사 목록 (선택/제외용) + 카테고리
  const { data: contractedPartners } = await supabase
    .from("partners")
    .select("id, company_name")
    .eq("status", "contracted")
    .order("company_name", { ascending: true });
  const contractedIds = (contractedPartners ?? []).map((p) => p.id);
  const { data: partnerCats } = contractedIds.length
    ? await supabase
        .from("partner_categories")
        .select("partner_id, category")
        .in("partner_id", contractedIds)
    : { data: [] as { partner_id: string; category: string }[] };
  const catsByPartner = new Map<string, string[]>();
  for (const c of partnerCats ?? []) {
    const list = catsByPartner.get(c.partner_id) ?? [];
    list.push(c.category);
    catsByPartner.set(c.partner_id, list);
  }
  const rfpPartners = (contractedPartners ?? []).map((p) => ({
    id: p.id,
    name: p.company_name,
    categories: catsByPartner.get(p.id) ?? [],
  }));

  // 이미 RFP가 발송된 대행사
  const { data: notifiedRows } = await supabase
    .from("rfp_notifications")
    .select("partner_id")
    .eq("request_id", id);
  const notifiedIds = (notifiedRows ?? []).map((r) => r.partner_id);
  const sentCount = notifiedIds.length;

  // 지원자 목록 (비교 뷰)
  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, partner_id, proposal, quote_monthly, start_available, status, submitted_at",
    )
    .eq("request_id", id)
    .order("submitted_at", { ascending: true });

  const appPartnerIds = (applications ?? []).map((a) => a.partner_id);
  const { data: appPartners } = appPartnerIds.length
    ? await supabase
        .from("partners")
        .select("id, company_name")
        .in("id", appPartnerIds)
    : { data: [] as { id: string; company_name: string }[] };
  const partnerNameMap = new Map(
    (appPartners ?? []).map((p) => [p.id, p.company_name]),
  );

  // 기존 후보(candidates) — 재선정 시 초기값 + 대행 결정
  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, application_id, partner_id, rank, status, recommendation_reason, scores")
    .eq("request_id", id);
  const candidateMap = new Map(
    (candidates ?? []).map((c) => [
      c.application_id,
      { reason: c.recommendation_reason, scores: c.scores },
    ]),
  );

  const decisionCandidates: DecisionCandidate[] = (candidates ?? []).map((c) => ({
    id: c.id,
    partnerName: partnerNameMap.get(c.partner_id) ?? "대행사",
    rank: c.rank,
    status: c.status,
  }));
  const isClosed = status === "closed_won" || status === "closed_lost";
  // 미팅 단계 이후에만 결정 패널 노출
  const showDecision =
    decisionCandidates.length > 0 &&
    ["candidates_sent", "meeting_scheduled", "closed_won", "closed_lost"].includes(
      status,
    );

  const applicants: ApplicantCard[] = (applications ?? []).map((a) => {
    const proposal = (a.proposal ?? {}) as {
      approach?: string;
      team_composition?: string | null;
      differentiation?: string | null;
    };
    return {
      applicationId: a.id,
      partnerName: partnerNameMap.get(a.partner_id) ?? "대행사",
      quote: a.quote_monthly,
      approach: proposal.approach ?? "",
      teamComposition: proposal.team_composition ?? null,
      differentiation: proposal.differentiation ?? null,
      startAvailable: a.start_available,
      isCandidate: candidateMap.has(a.id),
      reason: candidateMap.get(a.id)?.reason ?? "",
      scores: (candidateMap.get(a.id)?.scores ?? null) as ApplicantCard["scores"],
    };
  });

  // 증빙 파일 signed URL
  let proofUrl: string | null = null;
  if (brief.ad_spend_proof?.path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("client-files")
      .createSignedUrl(brief.ad_spend_proof.path, 600);
    proofUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/requests"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 매칭 요청 목록
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
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <Link
            href={`/rfp/${request.id}/print`}
            className="text-sm font-medium text-primary hover:underline"
          >
            RFP PDF 보기 →
          </Link>
        </div>
      </div>

      {sentCount > 0 ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
          이 요청에 대해 RFP {sentCount}건이 발송되었습니다.
        </div>
      ) : null}

      <RfpPanel
        requestId={request.id}
        status={status}
        partners={rfpPartners}
        requestChannels={brief.channels ?? []}
        notifiedIds={notifiedIds}
        alreadySent={sentCount > 0}
      />

      <Card>
        <CardHeader>
          <CardTitle>진행 타임라인</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={timeline} />
        </CardContent>
      </Card>

      <CandidateSelector
        requestId={request.id}
        applicants={applicants}
        locked={false}
      />

      {showDecision ? (
        <DecisionPanel
          requestId={request.id}
          candidates={decisionCandidates}
          closed={isClosed}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>광고주 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Field label="상호 (사업자명)" value={brief.company_name} />
          <Field label="사업자등록번호" value={brief.biz_reg_no} />
          <Field label="대표자명" value={brief.representative} />
          <Field label="브랜드명" value={brief.brand_name} />
          <Field
            label="담당자"
            value={
              brief.contact_name
                ? `${brief.contact_name}${brief.contact_title ? ` / ${brief.contact_title}` : ""}`
                : brief.contact_title
            }
          />
          <Field label="이메일" value={brief.email} />
          <Field label="연락처" value={brief.phone} />
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
          <Field
            label="성과조회 권한 부여 의향"
            value={brief.analysis_access_intent ? "있음" : "없음/미선택"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>브리프</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {brief.planned_budgets &&
          Object.keys(brief.planned_budgets).length > 0 ? (
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">
                집행 예정 월평균 광고예산 (매체별)
              </div>
              <div className="space-y-1">
                {Object.entries(brief.planned_budgets).map(([k, v]) => (
                  <div key={k} className="flex justify-between max-w-xs">
                    <span className="text-muted-foreground">
                      {MEDIA_LABEL[k] ?? k}
                    </span>
                    <span className="text-foreground">
                      {Number(v).toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">
              지난 3개월 소진액 증빙
            </div>
            {proofUrl ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {brief.ad_spend_proof?.name ?? "다운로드"} (10분 유효)
              </a>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        </CardContent>
      </Card>

      {request.admin_memo ? (
        <Card>
          <CardHeader>
            <CardTitle>운영자 메모</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">
            {request.admin_memo}
          </CardContent>
        </Card>
      ) : null}
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
