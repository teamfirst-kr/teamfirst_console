import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { appUrl } from "@/lib/email/newsletter";
import { sendResultEmail } from "@/lib/email/newsletter-notices";
import { isDueForSend } from "@/lib/newsletter/highlight";
import { reviewEmailAddress, sendIssueBatchCore } from "@/lib/newsletter/send";
import type { NewsletterIssueRow } from "@/types/database";

export type ScheduledSendSummary = {
  checked: number;
  processed: { id: string; title: string; sent: number; failed: number; remaining: number; completed: boolean; error?: string }[];
  budgetExhausted: boolean;
};

// 예약 발송 실행 — 승인됨·예약 시각 도달·미완료 호를 순서대로 공개하고 구독자에게 배치 발송.
// 시간 예산 안에서만 돌고, 못 보낸 분량은 다음 실행에서 이어간다(newsletter_deliveries 유니크로 중복 방지).
// 전원 발송이 끝나면 send_completed_at 을 기록하고 운영자에게 결과 메일을 보낸다.
export async function runNewsletterScheduledSends(opts: { now?: Date; budgetMs?: number } = {}): Promise<ScheduledSendSummary> {
  const now = opts.now ?? new Date();
  const budgetMs = opts.budgetMs ?? 40_000;
  const startedAt = Date.now();
  const admin = createAdminClient();
  const summary: ScheduledSendSummary = { checked: 0, processed: [], budgetExhausted: false };

  const { data, error } = await admin
    .from("newsletter_issues")
    .select("*")
    .not("approved_at", "is", null)
    .is("send_completed_at", null)
    .lte("send_scheduled_at", now.toISOString())
    .order("send_scheduled_at", { ascending: true })
    .limit(5);
  if (error) throw new Error(`예약 발송 대상 조회 실패: ${error.message}`);
  const due = ((data ?? []) as NewsletterIssueRow[]).filter((i) => isDueForSend(i, now));
  summary.checked = due.length;

  for (const issue of due) {
    const nowIso = new Date().toISOString();
    // 예약 시각 도달 → 공개 + 발송 시작 표시
    const patch: Partial<NewsletterIssueRow> = { updated_at: nowIso };
    if (issue.status !== "published") {
      patch.status = "published";
      patch.published_at = issue.published_at ?? nowIso;
    }
    if (!issue.send_started_at) patch.send_started_at = nowIso;
    const { error: pErr } = await admin.from("newsletter_issues").update(patch).eq("id", issue.id);
    if (pErr) {
      summary.processed.push({ id: issue.id, title: issue.title, sent: 0, failed: 0, remaining: -1, completed: false, error: pErr.message });
      continue;
    }

    let sent = 0;
    let failed = 0;
    let remaining = -1;
    let errorMsg: string | undefined;
    let completed = false;
    for (let guard = 0; guard < 400; guard++) {
      if (Date.now() - startedAt > budgetMs) {
        summary.budgetExhausted = true;
        break;
      }
      const r = await sendIssueBatchCore(issue.id);
      if (!r.ok) {
        errorMsg = r.error;
        break;
      }
      sent += r.sent;
      failed += r.failed;
      remaining = r.remaining;
      if (r.remaining === 0) {
        completed = true;
        break;
      }
    }

    if (completed) {
      const doneIso = new Date().toISOString();
      await admin.from("newsletter_issues").update({ send_completed_at: doneIso, updated_at: doneIso }).eq("id", issue.id);
      const [{ count: sentTotal }, { count: failedTotal }, { count: subscribed }] = await Promise.all([
        admin.from("newsletter_deliveries").select("id", { count: "exact", head: true }).eq("issue_id", issue.id).eq("status", "sent"),
        admin.from("newsletter_deliveries").select("id", { count: "exact", head: true }).eq("issue_id", issue.id).eq("status", "failed"),
        admin.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
      ]);
      const base = appUrl();
      const mail = sendResultEmail({
        title: issue.title,
        issueNo: issue.issue_no,
        sent: sentTotal ?? sent,
        failed: failedTotal ?? failed,
        total: subscribed ?? 0,
        publicUrl: `${base}/newsletter/${issue.slug}`,
        adminUrl: `${base}/admin/newsletter/${issue.id}`,
      });
      await sendEmail({ to: reviewEmailAddress(), subject: mail.subject, html: mail.html });
    } else if (errorMsg) {
      // 오류는 운영자에게 즉시 알림 (다음 실행에서 자동 재시도)
      const mail = sendResultEmail({
        title: issue.title,
        issueNo: issue.issue_no,
        sent,
        failed,
        total: 0,
        publicUrl: `${appUrl()}/newsletter/${issue.slug}`,
        adminUrl: `${appUrl()}/admin/newsletter/${issue.id}`,
        errors: [errorMsg],
      });
      await sendEmail({ to: reviewEmailAddress(), subject: `[발송 중단] ${mail.subject}`, html: mail.html });
    }
    summary.processed.push({ id: issue.id, title: issue.title, sent, failed, remaining, completed, ...(errorMsg ? { error: errorMsg } : {}) });
    if (summary.budgetExhausted) break;
  }
  return summary;
}
