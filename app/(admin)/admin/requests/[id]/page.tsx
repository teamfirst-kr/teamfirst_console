import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  REQUEST_MEDIA,
  REQUEST_STATUS_LABEL,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";
import type { RequestStatus } from "@/types/database";

import { RfpPanel } from "./rfp-panel";

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

  const brief = (request.brief ?? {}) as MatchingBrief;
  const status = request.status as RequestStatus;
  const badge = REQUEST_STATUS_LABEL[status] ?? {
    label: status,
    variant: "muted" as const,
  };

  // 계약 완료 파트너 수 (RFP 발송 대상)
  const { count: contractedCount } = await supabase
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("status", "contracted");

  // 이미 발송된 RFP 수
  const { count: sentCount } = await supabase
    .from("rfp_notifications")
    .select("id", { count: "exact", head: true })
    .eq("request_id", id);

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
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {sentCount && sentCount > 0 ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
          이 요청에 대해 RFP {sentCount}건이 발송되었습니다.
        </div>
      ) : null}

      <RfpPanel
        requestId={request.id}
        status={status}
        contractedCount={contractedCount ?? 0}
        alreadySent={Boolean(sentCount && sentCount > 0)}
      />

      <Card>
        <CardHeader>
          <CardTitle>지원 대행사 ({applications?.length ?? 0})</CardTitle>
          <CardDescription>
            지원서를 비교하고 상위 후보를 선정하세요. (선정 UI는 5주차)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!applications || applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              아직 지원한 대행사가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => {
                const proposal = (a.proposal ?? {}) as {
                  approach?: string;
                  team_composition?: string | null;
                  similar_cases?: string | null;
                  differentiation?: string | null;
                };
                return (
                  <div key={a.id} className="rounded-lg border p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {partnerNameMap.get(a.partner_id) ?? "대행사"}
                      </span>
                      <span className="text-primary font-medium">
                        {a.quote_monthly
                          ? `${a.quote_monthly.toLocaleString()}원/월`
                          : "견적 미기재"}
                      </span>
                    </div>
                    {a.start_available ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        시작 가능: {a.start_available}
                      </p>
                    ) : null}
                    <p className="mt-2 whitespace-pre-wrap text-foreground">
                      {proposal.approach}
                    </p>
                    {proposal.team_composition ? (
                      <p className="mt-2 text-muted-foreground">
                        <span className="text-xs">팀 구성</span> ·{" "}
                        {proposal.team_composition}
                      </p>
                    ) : null}
                    {proposal.differentiation ? (
                      <p className="mt-1 text-muted-foreground">
                        <span className="text-xs">차별점</span> ·{" "}
                        {proposal.differentiation}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>광고주 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Field label="브랜드명" value={brief.brand_name} />
          <Field label="담당자 직책" value={brief.contact_title} />
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
