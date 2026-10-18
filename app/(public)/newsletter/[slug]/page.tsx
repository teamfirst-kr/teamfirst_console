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
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-10 md:pt-14">
          <Link href="/newsletter" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
            ← Newsletter
          </Link>
          {issue.status !== "published" ? (
            <p className="mt-4 border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">초안 미리보기 — 아직 공개되지 않았습니다 (운영자에게만 보임).</p>
          ) : null}
          <p className="mt-8 flex flex-wrap items-center gap-x-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-primary">{cat.code}</span>
            <span aria-hidden>·</span>
            <span>{cat.label}</span>
            {issue.issue_no ? (
              <>
                <span aria-hidden>·</span>
                <span>Vol.{issue.issue_no}</span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span className="tracking-normal">{dateText}</span>
          </p>
          <h1 className="mt-4 break-keep text-[30px] font-extrabold leading-[1.25] tracking-[-0.02em] text-secondary md:text-[40px]">{issue.title}</h1>
          {issue.summary ? <p className="mt-5 break-keep text-[17px] leading-relaxed text-muted-foreground">{issue.summary}</p> : null}
        </div>
      </header>

      {issue.cover_url ? (
        <div className="mx-auto max-w-3xl px-6 pt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={issue.cover_url} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      ) : null}

      {unlocked ? (
        <>
          <div className="mx-auto max-w-3xl px-6 py-10">
            <div className="nl-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(issue.body_md, "web") }} />
          </div>

          {/* 주제와 이어지는 CTA + 상담 신청 양식 */}
          <section id="consult" className="mx-auto max-w-3xl scroll-mt-20 px-6 pb-20">
            <div className="border-t-2 border-secondary pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Consulting</p>
              <h2 className="mt-3 break-keep text-2xl font-extrabold leading-snug tracking-[-0.01em] text-secondary">{cta.title}</h2>
              <p className="mt-3 max-w-2xl break-keep text-[15px] leading-relaxed text-muted-foreground">{cta.body}</p>
              <div className="mt-8 bg-muted/40 p-6 md:p-8">
                <p className="text-sm font-bold text-secondary">팀퍼스트에 상담 신청하기</p>
                <p className="mt-1 text-xs text-muted-foreground">브랜드명·월 마케팅 예산·연락처만 남기시면 담당자가 연락드립니다.</p>
                <div className="mt-5">
                  <NewsletterConsultForm slug={issue.slug} defaultBrand={viewer?.brand_name} />
                </div>
              </div>
            </div>
            {viewer?.status === "unsubscribed" ? (
              <div className="mt-10 border-t pt-6">
                <p className="text-sm font-bold text-secondary">현재 수신거부 상태입니다</p>
                <p className="mt-1 text-xs text-muted-foreground">다음 호를 다시 받아보시려면 아래에서 등록해주세요.</p>
                <div className="mt-4">
                  <NewsletterSubscribeForm source={`issue:${issue.slug}`} submitLabel="다시 구독하기" refreshOnSuccess />
                </div>
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="border border-border bg-card p-7 md:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Subscribers only</p>
            <h2 className="mt-3 break-keep text-xl font-extrabold tracking-[-0.01em] text-secondary md:text-2xl">등록 후 전문을 확인하실 수 있습니다</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              사업자등록번호·브랜드명·이메일을 등록하면 이 호의 전문이 바로 열리고, 다음 호부터 메일로 받아보실 수 있습니다. 무료이며 언제든 수신거부할 수 있습니다.
            </p>
            <div className="mt-7">
              <NewsletterSubscribeForm source={`issue:${issue.slug}`} submitLabel="등록하고 계속 읽기" refreshOnSuccess />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
