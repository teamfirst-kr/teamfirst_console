import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKstDateTime, issueStage, STAGE_LABEL } from "@/lib/newsletter/highlight";
import type { NewsletterIssueRow } from "@/types/database";

import { isApprover, updateIssue } from "../actions";
import { IssueForm } from "../issue-form";
import { SendPanel } from "../send-panel";

export const dynamic = "force-dynamic";

export default async function EditIssuePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reviewed?: string }> }) {
  const [{ id }, { reviewed }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  // 본문·하이라이트 컬럼은 033/034 이후 세션 클라이언트로 읽을 수 없어 service_role 사용 ((admin) 레이아웃의 requireRole("admin") 뒤에서만 렌더)
  const [{ data }, { count: subscriberCount }] = await Promise.all([
    createAdminClient().from("newsletter_issues").select("*").eq("id", id).maybeSingle(),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
  ]);
  if (!data) notFound();
  const issue = data as NewsletterIssueRow;
  const bound = updateIssue.bind(null, issue.id);
  const stage = issueStage(issue);
  const approver = process.env.NEWSLETTER_APPROVER_EMAIL?.trim();
  const canApprove = await isApprover();
  const locked = stage === "scheduled" && !canApprove;

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
            {STAGE_LABEL[stage]}
            {stage === "scheduled" && issue.send_scheduled_at ? ` ${formatKstDateTime(issue.send_scheduled_at)} KST` : ""}
            {stage === "sent" ? ` ${issue.sent_count}명` : ""}
            {issue.status === "published" ? ` · 공개 ${(issue.published_at ?? "").slice(0, 10)}` : ""} · 최근 수정 {issue.updated_at.slice(0, 10)}
          </p>
        </div>
        <Link href={`/newsletter/${issue.slug}`} target="_blank" className="text-sm font-medium text-primary hover:underline">
          웹 미리보기 ↗
        </Link>
      </div>

      {reviewed ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">저장과 검수 요청이 완료되었습니다. 운영자 검수 후 승인·발송 예약이 진행됩니다.</p> : null}

      <SendPanel issue={issue} subscriberCount={subscriberCount ?? 0} approverHint={approver ? `승인은 ${approver} 계정만 가능합니다.` : null} isApprover={canApprove} />

      {locked ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">승인·발송 예약된 호는 승인 권한자만 수정할 수 있습니다.</p>
      ) : stage === "scheduled" ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
          발송 예약된 호입니다. 여기서 수정·저장하면 예약 시각에 수정된 내용으로 발송됩니다. 시각을 바꾸려면 위에서 예약을 취소한 뒤 다시 예약하세요.
        </p>
      ) : null}
      <IssueForm action={bound} initial={issue} submitLabel="변경 사항 저장" allowReviewRequest={!locked} />
    </div>
  );
}
