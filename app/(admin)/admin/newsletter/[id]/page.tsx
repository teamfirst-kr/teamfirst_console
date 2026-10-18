import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { NewsletterIssueRow } from "@/types/database";

import { updateIssue } from "../actions";
import { IssueForm } from "../issue-form";
import { SendPanel } from "../send-panel";

export const dynamic = "force-dynamic";

export default async function EditIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { count: subscriberCount }] = await Promise.all([
    supabase.from("newsletter_issues").select("*").eq("id", id).maybeSingle(),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
  ]);
  if (!data) notFound();
  const issue = data as NewsletterIssueRow;
  const bound = updateIssue.bind(null, issue.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/newsletter" className="text-xs text-muted-foreground hover:underline">
            ← 뉴스레터
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-secondary">
            {issue.issue_no ? `Vol.${issue.issue_no} · ` : ""}
            {issue.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {issue.status === "published" ? `공개 ${(issue.published_at ?? "").slice(0, 10)}` : "초안"} · 최근 수정 {issue.updated_at.slice(0, 10)}
          </p>
        </div>
        <Link href={`/newsletter/${issue.slug}`} target="_blank" className="text-sm font-medium text-primary hover:underline">
          웹 미리보기 ↗
        </Link>
      </div>

      <SendPanel issueId={issue.id} published={issue.status === "published"} sentCount={issue.sent_count} subscriberCount={subscriberCount ?? 0} />

      <IssueForm action={bound} initial={issue} submitLabel="변경 사항 저장" />
    </div>
  );
}
