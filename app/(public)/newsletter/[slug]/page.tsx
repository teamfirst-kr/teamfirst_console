import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NewsletterConsultForm } from "@/components/newsletter/consult-form";
import { NewsletterSubscribeForm } from "@/components/newsletter/subscribe-form";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { getNewsletterViewer } from "@/lib/newsletter/access";
import { CATEGORY_MAP, DEFAULT_CTA } from "@/lib/newsletter/constants";
import { renderMarkdown } from "@/lib/newsletter/markdown";
import type { NewsletterIssueRow } from "@/types/database";

export const dynamic = "force-dynamic";

async function loadIssue(slug: string): Promise<NewsletterIssueRow | null> {
  const supabase = await createClient();
  // RLS: 공개는 published만, 운영자는 draft도 조회 가능(미리보기)
  const { data } = await supabase.from("newsletter_issues").select("*").eq("slug", slug).maybeSingle();
  return (data as NewsletterIssueRow | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const issue = await loadIssue(slug);
  if (!issue) notFound(); // 메타데이터 단계에서 404 → 스트리밍 전에 상태코드 확정
  return {
    title: `${issue.title} — 팀퍼스트 뉴스레터`,
    description: issue.summary ?? undefined,
    openGraph: { title: issue.title, description: issue.summary ?? undefined, ...(issue.cover_url ? { images: [issue.cover_url] } : {}) },
  };
}

// 호 상세. 본문은 사업자번호·브랜드명·이메일을 등록한 구독자(쿠키 또는 메일 링크 ?t=)와 운영자에게만 보인다.
export default async function NewsletterIssuePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ slug }, { t }] = await Promise.all([params, searchParams]);
  const issue = await loadIssue(slug);
  if (!issue) notFound();
  const [viewer, role] = await Promise.all([getNewsletterViewer(t), getCurrentRole()]);
  const unlocked = !!viewer || role === "admin";
  const cat = CATEGORY_MAP[issue.category];
  const dateText = (issue.published_at ?? issue.created_at).slice(0, 10).replace(/-/g, ".");
  const cta = {
    title: issue.cta_title?.trim() || DEFAULT_CTA.title,
    body: issue.cta_body?.trim() || DEFAULT_CTA.body,
  };

  return (
    <article className="bg-background">
      <div className="mx-auto max-w-3xl px-6 pt-10">
        <Link href="/newsletter" className="text-sm text-muted-foreground hover:underline">
          ← 뉴스레터 보관함
        </Link>
        {issue.status !== "published" ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">초안 미리보기 — 아직 공개되지 않았습니다 (운영자에게만 보임).</p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-secondary">
            {cat.emoji} {cat.label}
          </span>
          {issue.issue_no ? <span>Vol.{issue.issue_no}</span> : null}
          <span>{dateText}</span>
        </div>
        <h1 className="mt-3 break-keep text-3xl font-extrabold leading-tight text-secondary md:text-4xl">{issue.title}</h1>
        {issue.summary ? <p className="mt-4 break-keep text-lg leading-relaxed text-muted-foreground">{issue.summary}</p> : null}
        {issue.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={issue.cover_url} alt="" className="mt-8 w-full rounded-2xl border object-cover" />
        ) : null}
      </div>

      {unlocked ? (
        <>
          <div className="mx-auto max-w-3xl px-6 py-10">
            <div className="nl-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(issue.body_md, "web") }} />
          </div>

          {/* 주제와 이어지는 CTA + 상담 신청 양식 */}
          <div id="consult" className="mx-auto max-w-3xl scroll-mt-20 px-6 pb-16">
            <div className="rounded-2xl bg-secondary p-7 text-secondary-foreground">
              <p className="text-xs font-bold tracking-[0.15em] text-sky-300">TEAMFIRST</p>
              <p className="mt-2 break-keep text-xl font-extrabold">{cta.title}</p>
              <p className="mt-2 break-keep text-sm leading-relaxed text-white/75">{cta.body}</p>
              <div className="mt-5 rounded-xl bg-white p-4 text-foreground">
                <p className="mb-3 text-sm font-bold text-secondary">💬 팀퍼스트에 상담 신청하기</p>
                <NewsletterConsultForm slug={issue.slug} defaultBrand={viewer?.brand_name} />
              </div>
            </div>
            {viewer?.status === "unsubscribed" ? (
              <div className="mt-6 rounded-2xl border bg-card p-5">
                <p className="text-sm font-bold text-secondary">현재 수신거부 상태입니다</p>
                <p className="mt-1 text-xs text-muted-foreground">다시 받아보시려면 아래에서 등록해주세요.</p>
                <div className="mt-3">
                  <NewsletterSubscribeForm source={`issue:${issue.slug}`} submitLabel="다시 구독하기" refreshOnSuccess />
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm md:p-8">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary to-primary" />
            <p className="text-xs font-bold tracking-[0.15em] text-primary">🔒 계속 읽으려면 등록이 필요합니다</p>
            <h2 className="mt-2 break-keep text-xl font-extrabold text-secondary">사업자번호 · 브랜드명 · 이메일을 등록하면 전체 내용을 바로 볼 수 있습니다</h2>
            <p className="mt-2 text-sm text-muted-foreground">등록 즉시 이 호의 전문이 열리고, 다음 호부터 메일로 받아보실 수 있습니다. 무료입니다.</p>
            <div className="mt-5">
              <NewsletterSubscribeForm source={`issue:${issue.slug}`} submitLabel="등록하고 계속 읽기" refreshOnSuccess />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
