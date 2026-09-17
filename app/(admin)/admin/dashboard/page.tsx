import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { PartnerStatus, RequestStatus } from "@/types/database";

import { monthlyEquivalent } from "../solutions/labels";

export const dynamic = "force-dynamic";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 운영자 대시보드 — 서비스(사업 라인)별로 현황을 한 화면에 (D-080)
//  광고비 페이백 · 솔루션 구독 · 대행사 매칭 · 마케터 매칭 · 콘텐츠
export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const count = (table: "partners" | "matching_requests" | "settlements" | "pb_applications" | "pb_clients" | "pb_monthly_settlements" | "marketer_requests" | "marketers" | "case_studies" | "pb_leads" | "solution_subscriptions", col: string, values: string[]) =>
    supabase.from(table).select("id", { count: "exact", head: true }).in(col, values);
  const partnerCount = (status: PartnerStatus) => count("partners", "status", [status]);
  const requestCount = (statuses: RequestStatus[]) => count("matching_requests", "status", statuses);

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
    { count: pbNewApps },
    { count: pbOnboarding },
    { count: pbActive },
    { count: pbSettlementOpen },
    { count: pbNewLeads },
    { count: mkSubmitted },
    { count: mkInProgress },
    { count: mkConfirmed },
    { count: mkPublished },
    { count: casePublished },
    { count: caseDraft },
    { data: subLeadRows },
    { data: subRows },
    ...stageResults
  ] = await Promise.all([
    partnerCount("pending"),
    partnerCount("reviewing"),
    partnerCount("contracted"),
    requestCount(["submitted"]),
    requestCount(["rfp_sent", "collecting", "curating", "candidates_sent"]),
    requestCount(["meeting_scheduled"]),
    count("settlements", "status", ["pending", "invoiced"]),
    count("pb_applications", "status", ["received", "reviewing"]),
    count("pb_clients", "status", ["agreement_sent", "agreement_signed", "transferring"]),
    count("pb_clients", "status", ["active"]),
    count("pb_monthly_settlements", "status", ["draft", "confirmed"]),
    supabase.from("pb_leads").select("id", { count: "exact", head: true }).eq("status", "new").not("source", "like", "sub:%"),
    count("marketer_requests", "status", ["submitted"]),
    count("marketer_requests", "status", ["reviewing", "matched", "interview"]),
    count("marketer_requests", "status", ["confirmed"]),
    count("marketers", "status", ["published"]),
    count("case_studies", "status", ["published"]),
    count("case_studies", "status", ["draft"]),
    supabase.from("pb_leads").select("id").eq("status", "new").like("source", "sub:%"),
    supabase.from("solution_subscriptions").select("status, amount, billing"),
    ...STAGES.map((s) => requestCount(s.statuses)),
  ]);

  const stageCounts = STAGES.map((s, i) => ({ label: s.label, count: stageResults[i]?.count ?? 0 }));
  const subNewLeads = (subLeadRows ?? []).length;
  const subs = (subRows ?? []) as { status: string; amount: number; billing: "monthly" | "yearly" }[];
  const subActive = subs.filter((s) => s.status === "active");
  const subPending = subs.filter((s) => s.status === "pending").length;
  const mrr = subActive.reduce((sum, s) => sum + monthlyEquivalent(Number(s.amount), s.billing), 0);

  const todos: { href: string; text: string }[] = [
    ...((pbNewApps ?? 0) > 0 ? [{ href: "/admin/payback", text: `페이백 신청 ${pbNewApps}건 검토하기` }] : []),
    ...((pbNewLeads ?? 0) > 0 ? [{ href: "/admin/payback", text: `페이백 간편 신청 리드 ${pbNewLeads}건 연락하기` }] : []),
    ...(subNewLeads > 0 ? [{ href: "/admin/solutions#leads", text: `솔루션 구독 문의 ${subNewLeads}건 연락하기` }] : []),
    ...(subPending > 0 ? [{ href: "/admin/solutions#subs", text: `솔루션 세팅 중 구독 ${subPending}건 활성화하기` }] : []),
    ...((pendingCount ?? 0) > 0 ? [{ href: "/admin/partners?status=pending", text: `파트너 입점 신청 ${pendingCount}건 처리하기` }] : []),
    ...((submittedReq ?? 0) > 0 ? [{ href: "/admin/requests?status=submitted", text: `매칭 요청 검수 대기 ${submittedReq}건 처리하기` }] : []),
    ...((mkSubmitted ?? 0) > 0 ? [{ href: "/admin/marketer-requests", text: `마케터 매칭 신청 ${mkSubmitted}건 검토하기` }] : []),
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-secondary">운영자 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">광고비 페이백 · 솔루션 구독 · 대행사 매칭 · 마케터 매칭 현황을 한 화면에서 확인하세요.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>오늘의 할 일</CardTitle>
          <CardDescription>대기 건이 있는 서비스부터 처리해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          {todos.length === 0
            ? "현재 처리 대기 중인 항목이 없습니다."
            : todos.map((t) => (
                <Link key={t.text} href={t.href} className="block text-primary hover:underline">
                  {t.text} →
                </Link>
              ))}
        </CardContent>
      </Card>

      <Section title="광고비 페이백" desc="대행권 지정 → 약정 → 이관 → 월 정산" href="/admin/payback" linkLabel="파이프라인">
        <Grid cols={4}>
          <StatCard label="신규 신청" value={pbNewApps ?? 0} hint="검토·약정 발송 필요" href="/admin/payback" />
          <StatCard label="온보딩 진행" value={pbOnboarding ?? 0} hint="약정·대행권 이관 중" href="/admin/payback" />
          <StatCard label="활성 고객사" value={pbActive ?? 0} hint="페이백 산정 대상" href="/admin/payback" />
          <StatCard label="지급 전 정산" value={pbSettlementOpen ?? 0} hint="확정·지급 대기" href="/admin/payback/settlements" />
        </Grid>
      </Section>

      <Section title="솔루션 구독" desc="CatchLog · AUTO REPORT · AUTO BID 유료 구독" href="/admin/solutions" linkLabel="구독 관리">
        <Grid cols={4}>
          <StatCard label="신규 문의" value={subNewLeads} hint="연락 필요" href="/admin/solutions#leads" />
          <StatCard label="세팅 중" value={subPending} hint="계정 발급·활성화 대기" href="/admin/solutions#subs" />
          <StatCard label="구독 중" value={subActive.length} hint="활성 구독 고객" href="/admin/solutions#subs" />
          <StatCard label="월 환산 매출" value={won(mrr)} hint="VAT 별도 · 연간은 ÷12" href="/admin/solutions" />
        </Grid>
      </Section>

      <Section title="대행사 매칭" desc="파트너 입점 · 매칭 요청 · RFP · 미팅 · 계약 · 정산" href="/admin/requests?view=board" linkLabel="매칭 보드">
        <Grid cols={3}>
          <StatCard label="파트너 신청 대기" value={pendingCount ?? 0} hint="신규 입점 검토 필요" href="/admin/partners?status=pending" />
          <StatCard label="파트너 검토/계약 중" value={reviewingCount ?? 0} hint="계약서 발송 또는 응답 대기" href="/admin/partners?status=reviewing" />
          <StatCard label="입점 파트너" value={contractedCount ?? 0} hint="RFP 발송 대상" href="/admin/partners?status=contracted" />
          <StatCard label="검수 대기 요청" value={submittedReq ?? 0} hint="RFP 발송 필요" href="/admin/requests?status=submitted" />
          <StatCard label="진행 중 매칭" value={activeReq ?? 0} hint="RFP~후보 선정" href="/admin/requests?view=board" />
          <StatCard label="미팅 예정" value={meetingReq ?? 0} hint="일정 확정/조율" href="/admin/meetings" />
        </Grid>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">매칭 파이프라인</p>
          <Link href="/admin/settlements" className="text-xs font-medium text-primary hover:underline">
            매칭 정산 대기 {settlementPending ?? 0}건 →
          </Link>
        </div>
        <Link href="/admin/requests?view=board" className="mt-2 flex flex-wrap items-stretch gap-2 rounded-xl border bg-card p-3 shadow-sm">
          {stageCounts.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center gap-2">
              <div className="flex-1 rounded-lg bg-muted/60 px-3 py-3 text-center">
                <div className="text-2xl font-bold text-secondary">{s.count}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
              </div>
              {i < stageCounts.length - 1 ? <span className="text-muted-foreground/50">›</span> : null}
            </div>
          ))}
        </Link>
      </Section>

      <Section title="마케터 매칭" desc="브랜드 신청 → 마케터 제안 · 인터뷰 → 협업 확정" href="/admin/marketer-requests" linkLabel="매칭 신청">
        <Grid cols={4}>
          <StatCard label="신청 접수" value={mkSubmitted ?? 0} hint="검토 필요" href="/admin/marketer-requests" />
          <StatCard label="진행 중" value={mkInProgress ?? 0} hint="검토·제안·인터뷰" href="/admin/marketer-requests" />
          <StatCard label="협업 확정" value={mkConfirmed ?? 0} hint="누적" href="/admin/marketer-requests" />
          <StatCard label="공개 마케터" value={mkPublished ?? 0} hint="로스터 노출 중" href="/admin/marketers" />
        </Grid>
      </Section>

      <Section title="콘텐츠" desc="공개 사이트에 노출되는 성공 사례" href="/admin/cases" linkLabel="사례 관리">
        <Grid cols={2}>
          <StatCard label="발행된 사례" value={casePublished ?? 0} hint="/cases 노출 중" href="/admin/cases" />
          <StatCard label="작성 중 사례" value={caseDraft ?? 0} hint="발행 대기" href="/admin/cases" />
        </Grid>
      </Section>
    </div>
  );
}

function Section({ title, desc, href, linkLabel, children }: { title: string; desc: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b pb-2">
        <div>
          <h2 className="text-base font-bold text-secondary">{title}</h2>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <Link href={href} className="text-xs font-medium text-primary hover:underline">
          {linkLabel} →
        </Link>
      </div>
      {children}
    </section>
  );
}

function Grid({ cols, children }: { cols: 2 | 3 | 4; children: React.ReactNode }) {
  const cls = cols === 4 ? "md:grid-cols-2 xl:grid-cols-4" : cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return <div className={`grid gap-4 ${cls}`}>{children}</div>;
}

function StatCard({ label, value, hint, href }: { label: string; value: string | number; hint: string; href?: string }) {
  const body = (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
      <div className="bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">{label}</div>
      <div className="px-4 py-5">
        <p className="text-3xl font-bold text-secondary">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
