import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterSubscribeForm } from "@/components/newsletter/subscribe-form";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_MAP, NEWSLETTER_CATEGORIES } from "@/lib/newsletter/constants";
import type { NewsletterCategory, NewsletterIssueRow } from "@/types/database";

export const metadata: Metadata = {
  title: "뉴스레터 — TeamFirst",
  description: "메타·구글·네이버 광고 업데이트, 컨퍼런스 인사이트, 브랜드·콘텐츠 트렌드, AI 업무 효율화 노하우를 메일로 받아보세요.",
};

export const dynamic = "force-dynamic";

type ListRow = Pick<NewsletterIssueRow, "id" | "slug" | "issue_no" | "title" | "summary" | "category" | "cover_url" | "published_at">;

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

  return (
    <div>
      <section className="bg-secondary py-14 text-secondary-foreground md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">TEAMFIRST NEWSLETTER</p>
            <h1 className="mt-3 break-keep text-[26px] font-extrabold leading-tight sm:text-3xl md:text-4xl">
              마케터가 매달 챙겨야 할 것만,
              <br className="hidden sm:block" /> 한 통으로 정리해 드립니다
            </h1>
            <p className="mt-4 max-w-xl break-keep text-white/75">
              광고 매체 업데이트부터 컨퍼런스 인사이트, 브랜드·콘텐츠 트렌드, AI 업무 효율화 노하우까지. 광고주와 대행사 실무자를 위해 팀퍼스트가 직접 정리합니다.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {NEWSLETTER_CATEGORIES.filter((c) => c.value !== "general").map((c) => (
                <li key={c.value} className="flex items-start gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm">
                  <span aria-hidden>{c.emoji}</span>
                  <span>
                    <span className="font-semibold text-white">{c.label}</span>
                    <span className="block text-xs text-white/60">{c.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
            <p className="text-lg font-extrabold text-white">무료 구독 신청</p>
            <p className="mt-1 text-xs text-white/60">월 1~2회 발송 · 스팸 없음 · 언제든 수신거부</p>
            <div className="mt-4">
              <NewsletterSubscribeForm source="newsletter" dark />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-secondary">지난 호 보기</h2>
            <p className="mt-1 text-sm text-muted-foreground">발행된 뉴스레터를 웹에서 바로 읽을 수 있습니다.</p>
          </div>
          <nav aria-label="카테고리" className="flex flex-wrap gap-1.5 text-xs">
            <Link href="/newsletter" className={"rounded-full border px-3 py-1.5 font-semibold " + (!active ? "border-secondary bg-secondary text-white" : "bg-card text-muted-foreground hover:text-foreground")}>
              전체
            </Link>
            {NEWSLETTER_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/newsletter?category=${c.value}`}
                className={"rounded-full border px-3 py-1.5 font-semibold " + (active === c.value ? "border-secondary bg-secondary text-white" : "bg-card text-muted-foreground hover:text-foreground")}
              >
                {c.emoji} {c.label}
              </Link>
            ))}
          </nav>
        </div>

        {issues.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            첫 호를 준비하고 있습니다. 구독해 두시면 발행 즉시 메일로 보내드립니다.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((i) => {
              const cat = CATEGORY_MAP[i.category];
              return (
                <Link key={i.id} href={`/newsletter/${i.slug}`} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  {i.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.cover_url} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-secondary to-primary text-5xl">{cat.emoji}</div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                      <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-secondary">{cat.label}</span>
                      {i.issue_no ? <span>Vol.{i.issue_no}</span> : null}
                      <span>{(i.published_at ?? "").slice(0, 10).replace(/-/g, ".")}</span>
                    </div>
                    <p className="mt-2 break-keep text-base font-bold leading-snug text-secondary group-hover:underline">{i.title}</p>
                    {i.summary ? <p className="mt-1.5 line-clamp-3 break-keep text-sm text-muted-foreground">{i.summary}</p> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
