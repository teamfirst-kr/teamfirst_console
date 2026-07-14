import { format } from "date-fns";

import {
  REQUEST_MEDIA,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";

const MEDIA_LABEL = Object.fromEntries(
  REQUEST_MEDIA.map((m) => [m.value, m.label]),
);

// 매칭 요청 brief를 RFP 문서로 렌더링 (인쇄·PDF·화면 공용).
// masked=true → 광고주 PII(상호/대표/연락처 등)를 숨긴다(파트너 노출용).
export function RfpDocument({
  brief,
  title,
  budgetMonthly,
  issuedAt,
  masked = false,
}: {
  brief: MatchingBrief;
  title: string;
  budgetMonthly?: number | null;
  issuedAt?: string | null;
  masked?: boolean;
}) {
  const plannedBudgets = brief.planned_budgets ?? {};
  const hasPlanned = Object.keys(plannedBudgets).length > 0;

  return (
    <div className="rfp-doc mx-auto max-w-3xl space-y-5 text-foreground">
      {/* 표지 */}
      <header className="rfp-cover rounded-xl bg-secondary p-8 text-secondary-foreground">
        <div className="text-xs font-bold tracking-widest text-white/50">
          TEAM FIRST · AGENCY MATCHING RFP
        </div>
        <p className="mt-6 text-sm text-white/70">{brief.brand_name}</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight">
          광고대행 제안요청서
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            {brief.category}
          </span>
          <span className="text-xs text-white/70">
            발행일자{" "}
            {format(new Date(issuedAt ?? Date.now()), "yyyy.MM.dd")}
          </span>
        </div>
      </header>

      {/* 광고주 정보 (full 모드에서만) */}
      {!masked ? (
        <Section title="광고주 정보">
          <Grid>
            <Field label="상호(사업자명)" value={brief.company_name} />
            <Field label="사업자등록번호" value={brief.biz_reg_no} />
            <Field label="대표자명" value={brief.representative} />
            <Field
              label="담당자"
              value={[brief.contact_name, brief.contact_title]
                .filter(Boolean)
                .join(" / ")}
            />
            <Field label="연락처" value={brief.phone} />
            <Field label="이메일" value={brief.email} />
          </Grid>
        </Section>
      ) : null}

      {/* 브랜드 및 서비스 소개 */}
      <Section title="브랜드 및 서비스 소개">
        <Field label="브랜드" value={brief.brand_name} />
        <Field label="카테고리" value={brief.category} />
        <Field label="Website" value={brief.website || "-"} />
        <Block label="브랜드 소개" value={brief.product_intro} />
      </Section>

      {/* 프로젝트 배경 및 예산 */}
      <Section title="프로젝트 배경 및 예산">
        <Block label="모집 배경" value={brief.reason} />
        <Field label="계약 기간" value={brief.duration} />
        <div>
          <div className="mb-1.5 text-xs text-muted-foreground">
            집행 예정 월평균 광고예산
          </div>
          {hasPlanned ? (
            <div className="space-y-1">
              {Object.entries(plannedBudgets).map(([k, v]) => (
                <div key={k} className="flex max-w-xs justify-between">
                  <span className="text-muted-foreground">
                    {MEDIA_LABEL[k] ?? k}
                  </span>
                  <span className="font-medium">{Number(v).toLocaleString()}원</span>
                </div>
              ))}
              {budgetMonthly ? (
                <div className="mt-1 flex max-w-xs justify-between border-t pt-1">
                  <span className="font-medium">합계</span>
                  <span className="font-bold text-primary">
                    {budgetMonthly.toLocaleString()}원
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <p>{budgetMonthly ? `${budgetMonthly.toLocaleString()}원` : "협의"}</p>
          )}
        </div>
      </Section>

      {/* 마케팅 목표 및 KPI */}
      <Section title="마케팅 목표 및 KPI">
        <TagRow label="최우선 마케팅 목표" values={brief.marketing_goals} />
        <TagRow label="핵심 성과 지표 (KPI)" values={brief.kpis} />
      </Section>

      {/* 대행 범위 및 운영 툴 */}
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

      {/* 커뮤니케이션 */}
      <Section title="커뮤니케이션 요청">
        <TagRow label="리포트 주기" values={brief.report_cycles} />
        <TagRow label="미팅 주기" values={brief.meeting_cycles} />
      </Section>

      {/* 파트너 요건 및 계약 */}
      <Section title="파트너사 요건 및 계약">
        <Block label="매칭 희망 파트너" value={brief.preferred_agency} />
        <Block label="매칭 지양 파트너" value={brief.avoided_agency || "해당 없음"} />
        <TagRow label="계약 방식" values={brief.payment_methods} />
      </Section>

      <p className="rfp-note text-center text-xs text-muted-foreground">
        본 RFP는 TeamFirst 콘솔에서 생성되었습니다 · {title}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rfp-section rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
        <span className="inline-block h-4 w-1 rounded bg-primary" />
        {title}
      </h2>
      <div className="space-y-4 text-sm">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-words">{value || "-"}</div>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-muted-foreground">{label}</div>
      <p className="whitespace-pre-wrap">{value || "-"}</p>
    </div>
  );
}

function TagRow({ label, values }: { label: string; values?: string[] }) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1">
        {!values || values.length === 0 ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          values.map((v) => (
            <span
              key={v}
              className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
            >
              {v}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
