import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterSubscribeForm } from "@/components/newsletter/subscribe-form";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_MAP, NEWSLETTER_CATEGORIES } from "@/lib/newsletter/constants";
import type { NewsletterCategory, NewsletterIssueRow } from "@/types/database";

export const metadata: Metadata = {
  title: "뉴스레터 — TeamFirst",
  description: "메타·구글·네이버 광고 업데이트, 컨퍼런스 인사이트, 브랜드·콘텐츠 트렌드, AI 업무 효율화 노하우를 정리해 보내드립니다.",
};

export const dynamic = "force-dynamic";

type ListRow = Pick<NewsletterIssueRow, "id" | "slug" | "issue_no" | "title" | "summary" | "category" | "cover_url" | "published_at">;

const fmtDate = (iso: string | null) => (iso ?? "").slice(0, 10).replace(/-/g, ".");

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const active = (NEWSLETTER_CATEGORIES.some((c) => c.value === category) ? category : null) as NewsletterCategory | null;
  const supabase = await createClient();
  let q = supabase
    .from("newsletter_issues")
    .select("id, slug, issue_no, title, summary, category, cover_url, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(60);
  if (active) q = q.eq("category", active);
  const { data, error } = await q;
  const issues = (error ? [] : (data ?? [])) as ListRow[];
  const [latest, ...rest] = issues;

  return (
    <div className="bg-background">
      {/* 소개 + 구독 */}
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:py-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">TeamFirst Newsletter</p>
            <h1 className="mt-5 break-keep text-[32px] font-extrabold leading-[1.2] tracking-[-0.02em] text-secondary md:text-[44px]">
              광고 실무자를 위한
              <br />
              주 3회 브리핑
            </h1>
            <p className="mt-6 max-w-lg break-keep text-[15px] leading-relaxed text-muted-foreground md:text-base">
              매체 업데이트부터 컨퍼런스 인사이트, 브랜드·콘텐츠 트렌드, AI 업무 효율화까지. 광고주와 대행사 실무자가 매주 확인해야 할 변화만 골라 팀퍼스트가 직접 정리합니다.
            </p>
            <ol className="mt-10 divide-y border-y">
              {NEWSLETTER_CATEGORIES.filter((c) => c.value !== "general").map((c, i) => (
                <li key={c.value} className="grid grid-cols-[2.5rem_1fr] items-baseline gap-3 py-3.5">
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">0{i + 1}</span>
                  <span>
                    <span className="text-[15px] font-bold text-secondary">{c.label}</span>
                    <span className="ml-3 text-sm text-muted-foreground">{c.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="md:pl-6">
            <div className="border border-border bg-card p-7 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Subscribe</p>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.01em] text-secondary">구독 신청</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">주 3회(월·수·금) 발송. 사업자등록번호·브랜드명·이메일로 등록하면 지난 호 전문도 바로 열람할 수 있습니다.</p>
              <div className="mt-6">
                <NewsletterSubscribeForm source="newsletter" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 보관함 */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Archive</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.01em] text-secondary">지난 호</h2>
          </div>
          <nav aria-label="카테고리" className="-mb-4 flex flex-wrap gap-x-6 text-sm">
            <Tab href="/newsletter" active={!active}>
              전체
            </Tab>
            {NEWSLETTER_CATEGORIES.map((c) => (
              <Tab key={c.value} href={`/newsletter?category=${c.value}`} active={active === c.value}>
                {c.label}
              </Tab>
            ))}
          </nav>
        </div>

        {issues.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-muted-foreground">첫 호를 준비하고 있습니다. 등록해 두시면 발행 즉시 메일로 보내드립니다.</p>
          </div>
        ) : (
          <>
            {latest ? <FeaturedIssue issue={latest} /> : null}
            {rest.length > 0 ? (
              <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((i) => (
                  <IssueCard key={i.id} issue={i} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        "border-b-2 pb-4 transition-colors " +
        (active ? "border-secondary font-semibold text-secondary" : "border-transparent text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </Link>
  );
}

function Cover({ issue, className }: { issue: ListRow; className: string }) {
  const cat = CATEGORY_MAP[issue.category];
  return issue.cover_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={issue.cover_url} alt="" className={className + " object-cover"} />
  ) : (
    <div className={className + " flex flex-col justify-between bg-secondary p-6 text-white"}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">{cat.code}</span>
      <span className="text-4xl font-extrabold tracking-[-0.02em]">{issue.issue_no ? `Vol.${issue.issue_no}` : "TeamFirst"}</span>
    </div>
  );
}

function Meta({ issue }: { issue: ListRow }) {
  const cat = CATEGORY_MAP[issue.category];
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <span className="text-primary">{cat.code}</span>
      {issue.issue_no ? (
        <>
          <span aria-hidden>·</span>
          <span>Vol.{issue.issue_no}</span>
        </>
      ) : null}
      <span aria-hidden>·</span>
      <span className="tracking-normal">{fmtDate(issue.published_at)}</span>
    </p>
  );
}

function FeaturedIssue({ issue }: { issue: ListRow }) {
  return (
    <Link href={`/newsletter/${issue.slug}`} className="group mt-10 grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
      <Cover issue={issue} className="aspect-[16/9] w-full" />
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Latest</p>
        <Meta issue={issue} />
        <h3 className="mt-3 break-keep text-2xl font-extrabold leading-snug tracking-[-0.01em] text-secondary group-hover:underline md:text-[28px]">{issue.title}</h3>
        {issue.summary ? <p className="mt-3 line-clamp-3 break-keep text-[15px] leading-relaxed text-muted-foreground">{issue.summary}</p> : null}
        <span className="mt-5 inline-block text-sm font-semibold text-secondary">읽기 →</span>
      </div>
    </Link>
  );
}

function IssueCard({ issue }: { issue: ListRow }) {
  return (
    <Link href={`/newsletter/${issue.slug}`} className="group block">
      <Cover issue={issue} className="aspect-[16/9] w-full" />
      <div className="mt-4">
        <Meta issue={issue} />
        <h3 className="mt-2 break-keep text-[17px] font-bold leading-snug tracking-[-0.01em] text-secondary group-hover:underline">{issue.title}</h3>
        {issue.summary ? <p className="mt-2 line-clamp-2 break-keep text-sm leading-relaxed text-muted-foreground">{issue.summary}</p> : null}
      </div>
    </Link>
  );
}
