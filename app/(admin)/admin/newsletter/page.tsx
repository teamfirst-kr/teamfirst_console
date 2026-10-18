import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_MAP } from "@/lib/newsletter/constants";
import type { NewsletterIssueRow } from "@/types/database";

export const dynamic = "force-dynamic";

type ListRow = Pick<NewsletterIssueRow, "id" | "slug" | "issue_no" | "title" | "category" | "status" | "published_at" | "sent_at" | "sent_count" | "updated_at">;

export default async function AdminNewsletterPage() {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [{ data: issueData, error: issueError }, { count: subscribed }, { count: unsubscribed }, { count: newThisMonth }, { count: brands }, { count: agencies }] = await Promise.all([
    supabase
      .from("newsletter_issues")
      .select("id, slug, issue_no, title, category, status, published_at, sent_at, sent_count, updated_at")
      .order("created_at", { ascending: false }),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "unsubscribed"),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed").eq("org_type", "brand"),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed").eq("org_type", "agency"),
  ]);
  const issues = (issueError ? [] : (issueData ?? [])) as ListRow[];
  const apiEnabled = !!process.env.NEWSLETTER_API_KEY;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">뉴스레터</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            호를 작성·공개하고 구독자에게 발송합니다. 열람·수신에는 사업자번호·브랜드명·이메일 등록이 필요해 브랜드사·대행사 DB가 쌓입니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/newsletter/subscribers">구독자 관리</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/newsletter/new">+ 새 호 작성</Link>
          </Button>
        </div>
      </div>

      {issueError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          뉴스레터 테이블을 조회하지 못했습니다. 마이그레이션 032(newsletter_*)를 적용했는지 확인하세요. ({issueError.message})
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="구독 중" value={subscribed ?? 0} hint={`브랜드사 ${brands ?? 0} · 대행사 ${agencies ?? 0}`} href="/admin/newsletter/subscribers" />
        <Stat label="이번 달 신규 등록" value={newThisMonth ?? 0} hint="사업자번호·브랜드명 포함 DB" href="/admin/newsletter/subscribers" />
        <Stat label="수신거부" value={unsubscribed ?? 0} hint="발송 대상에서 제외" href="/admin/newsletter/subscribers?status=unsubscribed" />
        <Stat label="발행 호" value={issues.filter((i) => i.status === "published").length} hint={`초안 ${issues.filter((i) => i.status === "draft").length}`} />
      </div>

      <div className={"rounded-lg border p-3 text-xs " + (apiEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800")}>
        {apiEnabled
          ? "🤖 Cowork 자동화 API 활성 — Cowork가 작성한 호는 이 목록에 초안으로 들어옵니다. 내용 확인 후 공개·발송하세요. (프롬프트: docs/COWORK_NEWSLETTER_PROMPT.md)"
          : "🤖 Cowork 자동화 API 비활성 — Vercel 환경변수 NEWSLETTER_API_KEY를 설정하면 Cowork가 호를 자동 작성해 초안으로 올릴 수 있습니다. (docs/COWORK_NEWSLETTER_PROMPT.md)"}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">호 목록 ({issues.length})</h2>
        {issues.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">아직 작성된 호가 없습니다. “새 호 작성”에서 5개 섹션 템플릿으로 시작하세요.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">호 / 제목</th>
                  <th className="px-4 py-2.5 font-medium">카테고리</th>
                  <th className="px-4 py-2.5 font-medium">상태</th>
                  <th className="px-4 py-2.5 font-medium">발송</th>
                  <th className="px-4 py-2.5 font-medium">수정</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {issues.map((i) => {
                  const cat = CATEGORY_MAP[i.category];
                  return (
                    <tr key={i.id}>
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/newsletter/${i.id}`} className="font-semibold text-foreground hover:underline">
                          {i.issue_no ? `Vol.${i.issue_no} · ` : ""}
                          {i.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">/newsletter/{i.slug}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        {cat.emoji} {cat.label}
                      </td>
                      <td className="px-4 py-2.5">
                        {i.status === "published" ? <Badge variant="success">공개 {(i.published_at ?? "").slice(0, 10)}</Badge> : <Badge variant="warning">초안</Badge>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{i.sent_count > 0 ? `${i.sent_count}명 · ${(i.sent_at ?? "").slice(0, 10)}` : "미발송"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{i.updated_at.slice(0, 10)}</td>
                      <td className="px-4 py-2.5 text-right text-xs">
                        <Link href={`/newsletter/${i.slug}`} target="_blank" className="text-primary hover:underline">
                          미리보기
                        </Link>
                        <span className="mx-1.5 text-muted-foreground">·</span>
                        <Link href={`/admin/newsletter/${i.id}`} className="text-primary hover:underline">
                          편집·발송
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

function Stat({ label, value, hint, href }: { label: string; value: number; hint: string; href?: string }) {
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
