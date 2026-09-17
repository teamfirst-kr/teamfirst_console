import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateText } from "@/components/date-text";
import { createClient } from "@/lib/supabase/server";
import { SOLUTION_BRAND, describeSubscriptionSource, parseSubscriptionSource, type SolutionKey } from "@/lib/solution-pricing";
import type { SolutionSubscriptionRow } from "@/types/database";

import { LEAD_STATUS_LABEL, SUB_STATUS_LABEL, monthlyEquivalent } from "./labels";
import { LeadStatusEditor } from "./lead-row";
import { SubscriptionStatusActions } from "./subscription-row";

export const dynamic = "force-dynamic";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const brandOf = (k: string) => SOLUTION_BRAND[k as SolutionKey] ?? k;

type LeadRow = {
  id: string;
  brand_name: string;
  phone: string;
  expected_budget: number | null;
  source: string | null;
  status: "new" | "contacted" | "converted" | "closed";
  memo: string | null;
  created_at: string;
};

export default async function AdminSolutionsPage() {
  const supabase = await createClient();
  const [{ data: leadData, error: leadError }, { data: subData, error: subError }] = await Promise.all([
    supabase
      .from("pb_leads")
      .select("id, brand_name, phone, expected_budget, source, status, memo, created_at")
      .like("source", "sub:%")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("solution_subscriptions").select("*").order("created_at", { ascending: false }),
  ]);
  const leads = (leadError ? [] : (leadData ?? [])) as LeadRow[];
  const subs = (subError ? [] : (subData ?? [])) as SolutionSubscriptionRow[];

  const newLeads = leads.filter((l) => l.status === "new").length;
  const active = subs.filter((s) => s.status === "active");
  const mrr = active.reduce((sum, s) => sum + monthlyEquivalent(Number(s.amount), s.billing), 0);
  const pendingSubs = subs.filter((s) => s.status === "pending").length;
  const pausedSubs = subs.filter((s) => s.status === "paused").length;

  const ORDER: Record<string, number> = { pending: 0, active: 1, paused: 2, ended: 3 };
  const sortedSubs = [...subs].sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.created_at.localeCompare(a.created_at));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">솔루션 구독 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            유료 구독 문의 → 세팅 → 구독 중 관리. 페이백 고객의 무료 이용은 페이백 파이프라인에서 관리합니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/solutions/new">+ 구독 등록</Link>
        </Button>
      </div>

      {leadError || subError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          솔루션 구독 테이블을 조회하지 못했습니다. 마이그레이션 029(solution_subscriptions·pb_leads.status)를 적용했는지 확인하세요.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="신규 문의" value={newLeads} hint="연락 필요" href="#leads" />
        <Stat label="구독 중" value={active.length} hint={`세팅 중 ${pendingSubs} · 일시정지 ${pausedSubs}`} href="#subs" />
        <Stat label="월 환산 매출" value={won(mrr)} hint="구독 중 · VAT 별도 (연간은 ÷12)" />
        <Stat label="총 구독 고객" value={subs.length} hint="종료 포함 누적" />
      </div>

      {/* ── 구독 문의 리드 ── */}
      <section id="leads" className="scroll-mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">🧩 구독 문의 (최근 {leads.length})</h2>
        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">아직 구독 문의가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">브랜드</th>
                  <th className="px-4 py-2.5 font-medium">연락처</th>
                  <th className="px-4 py-2.5 font-medium">문의 내역</th>
                  <th className="px-4 py-2.5 font-medium">예상 구독료</th>
                  <th className="px-4 py-2.5 font-medium">처리</th>
                  <th className="px-4 py-2.5 font-medium">접수</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map((l) => {
                  const sub = parseSubscriptionSource(l.source);
                  const st = LEAD_STATUS_LABEL[l.status] ?? LEAD_STATUS_LABEL.new;
                  return (
                    <tr key={l.id} className={l.status === "new" ? "bg-amber-50/40" : undefined}>
                      <td className="px-4 py-2.5 align-top">
                        <p className="font-semibold text-foreground">{l.brand_name}</p>
                        <Badge variant={st.variant} className="mt-1">
                          {st.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-primary hover:underline">
                          📞 {l.phone}
                        </a>
                      </td>
                      <td className="px-4 py-2.5 align-top text-xs text-muted-foreground">
                        {describeSubscriptionSource(l.source)?.replace(/^구독 문의 · /, "") ?? l.source ?? "-"}
                      </td>
                      <td className="px-4 py-2.5 align-top whitespace-nowrap">
                        {l.expected_budget ? (
                          <>
                            {won(Number(l.expected_budget))}
                            <span className="ml-1 text-xs text-muted-foreground">/ {sub?.billing === "yearly" ? "연" : "월"}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        <LeadStatusEditor leadId={l.id} status={l.status} memo={l.memo} />
                        {l.status !== "converted" ? (
                          <Link href={`/admin/solutions/new?lead=${l.id}`} className="mt-1.5 inline-block text-xs font-medium text-primary hover:underline">
                            이 문의로 구독 등록 →
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 align-top whitespace-nowrap text-muted-foreground">
                        <DateText value={l.created_at} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 구독 고객 ── */}
      <section id="subs" className="scroll-mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">구독 고객 ({subs.length})</h2>
        {sortedSubs.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            등록된 구독 고객이 없습니다. 문의를 전환하거나 상단 &ldquo;구독 등록&rdquo;으로 추가하세요.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">브랜드</th>
                  <th className="px-4 py-2.5 font-medium">솔루션</th>
                  <th className="px-4 py-2.5 font-medium">결제</th>
                  <th className="px-4 py-2.5 font-medium">청구액</th>
                  <th className="px-4 py-2.5 font-medium">상태</th>
                  <th className="px-4 py-2.5 font-medium">일정</th>
                  <th className="px-4 py-2.5 font-medium">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedSubs.map((s) => {
                  const st = SUB_STATUS_LABEL[s.status] ?? SUB_STATUS_LABEL.pending;
                  return (
                    <tr key={s.id} className={s.status === "ended" ? "text-muted-foreground" : undefined}>
                      <td className="px-4 py-2.5 align-top">
                        <Link href={`/admin/solutions/${s.id}`} className="font-semibold text-foreground hover:underline">
                          {s.brand_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {s.contact_name ? `${s.contact_name} · ` : ""}
                          {s.phone}
                        </p>
                        {s.solution_login_id ? <p className="text-[11px] text-muted-foreground">ID {s.solution_login_id}</p> : null}
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        <div className="flex flex-wrap gap-1">
                          {s.solutions.map((k) => (
                            <span key={k} className="rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                              {brandOf(k)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-top text-xs">
                        {s.billing === "yearly" ? "연간" : "월간"}
                        {s.pv ? <span className="block text-muted-foreground">CatchLog 월 {Math.round(s.pv / 10_000)}만 PV</span> : null}
                      </td>
                      <td className="px-4 py-2.5 align-top whitespace-nowrap font-semibold">
                        {won(Number(s.amount))}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">/ {s.billing === "yearly" ? "연" : "월"}</span>
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5 align-top text-xs text-muted-foreground">
                        {s.starts_at ? <span className="block">시작 {s.starts_at}</span> : null}
                        {s.next_billing_at && s.status !== "ended" ? <span className="block">다음 결제 {s.next_billing_at}</span> : null}
                        {s.ends_at ? <span className="block">종료 {s.ends_at}</span> : null}
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        <SubscriptionStatusActions id={s.id} status={s.status} />
                        <Link href={`/admin/solutions/${s.id}`} className="mt-1 inline-block text-xs text-primary hover:underline">
                          수정 →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint, href }: { label: string; value: string | number; hint: string; href?: string }) {
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
