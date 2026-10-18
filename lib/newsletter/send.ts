import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { bccAddress, sendEmail, sendEmailBatch } from "@/lib/email/resend";
import { appUrl, newsletterEmail, type NewsletterMailVariant } from "@/lib/email/newsletter";
import type { NewsletterIssueRow, NewsletterSubscriberRow } from "@/types/database";

export const BATCH_SIZE = 50; // Resend batch 한도 100 이하, 서버리스 타임아웃 여유
export const DUMMY_TOKEN = "0".repeat(48); // 테스트·검수·사본 메일용 (실제 구독자 토큰을 담지 않음)

export type SendBatchResult =
  | { ok: true; sent: number; failed: number; remaining: number; total: number }
  | { ok: false; error: string };

export function reviewEmailAddress(): string {
  return process.env.NEWSLETTER_REVIEW_EMAIL?.trim() || "rldbs06@naver.com";
}

// 본문·하이라이트 컬럼은 033/034 이후 service_role 로만 읽는다 (호출부가 운영자 확인 또는 크론 인증을 끝낸 뒤 사용)
export async function loadIssueAdmin(id: string): Promise<NewsletterIssueRow | null> {
  const { data } = await createAdminClient().from("newsletter_issues").select("*").eq("id", id).maybeSingle();
  return (data as NewsletterIssueRow | null) ?? null;
}

export function buildSubscriberMail(
  issue: NewsletterIssueRow,
  sub: Pick<NewsletterSubscriberRow, "email" | "name" | "token">,
  variant: NewsletterMailVariant = "subscriber",
  reviewHeader?: { note: string | null; adminUrl: string; requestedAt: string },
) {
  const base = appUrl();
  const mail = newsletterEmail({
    issue,
    recipientName: sub.name,
    unsubscribeUrl: `${base}/newsletter/unsubscribe?token=${sub.token}`,
    webUrl: `${base}/newsletter/open?t=${sub.token}&slug=${encodeURIComponent(issue.slug)}`,
    variant,
    reviewHeader,
  });
  // RFC 8058 원클릭 수신거부 (Gmail/Yahoo 대량 발신 요건)
  const headers = {
    "List-Unsubscribe": `<${base}/api/newsletter/unsubscribe?token=${sub.token}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
  return { ...mail, headers };
}

// 구독자 발송 1배치 — 아직 발송 이력이 없는 구독자에게 BATCH_SIZE명씩. 호출부(어드민 버튼·크론)가 remaining=0 까지 반복한다.
// 발송 이력(newsletter_deliveries)이 유니크라 중복 발송되지 않고, 중단돼도 이어서 보낼 수 있다.
// 조회·이력 기록 오류는 즉시 중단(중복 발송 방지). 불량 주소는 permissive 검증으로 'failed' 이력을 남겨 재시도 대상에서 제외.
export async function sendIssueBatchCore(id: string): Promise<SendBatchResult> {
  const admin = createAdminClient();
  const issue = await loadIssueAdmin(id);
  if (!issue) return { ok: false, error: "호를 찾을 수 없습니다." };
  if (issue.status !== "published") return { ok: false, error: "공개(published)된 호만 발송할 수 있습니다." };

  const [{ data: subs, error: subsError }, { data: delivered, error: delError }] = await Promise.all([
    admin.from("newsletter_subscribers").select("id, email, name, token").eq("status", "subscribed").order("created_at", { ascending: true }),
    admin.from("newsletter_deliveries").select("subscriber_id").eq("issue_id", id),
  ]);
  if (subsError) return { ok: false, error: `구독자 조회 실패: ${subsError.message}` };
  if (delError) return { ok: false, error: `발송 이력 조회 실패: ${delError.message}` };
  const done = new Set((delivered ?? []).map((d) => d.subscriber_id));
  const pending = ((subs ?? []) as Pick<NewsletterSubscriberRow, "id" | "email" | "name" | "token">[]).filter((s) => !done.has(s.id));
  const total = (subs ?? []).length;
  if (pending.length === 0) return { ok: true, sent: 0, failed: 0, remaining: 0, total };

  const batch = pending.slice(0, BATCH_SIZE);
  const mails = batch.map((s) => ({ sub: s, mail: buildSubscriberMail(issue, s) }));
  const r = await sendEmailBatch(mails.map((m) => ({ to: m.sub.email, subject: m.mail.subject, html: m.mail.html, headers: m.mail.headers })));
  if (!r.ok) {
    if (r.skipped) return { ok: false, error: "RESEND_API_KEY가 설정되지 않아 발송할 수 없습니다." };
    return { ok: false, error: `발송 실패: ${r.error ?? "unknown"}` }; // 배치 전체 실패 — 이력은 남기지 않아 다음 시도에 재발송
  }
  const failedByIndex = new Map(r.failures.map((f) => [f.index, f.message]));
  const now = new Date().toISOString();
  const rows = batch.map((s, i) => ({
    issue_id: id,
    subscriber_id: s.id,
    status: (failedByIndex.has(i) ? "failed" : "sent") as "sent" | "failed",
    error: failedByIndex.get(i)?.slice(0, 500) ?? null,
    sent_at: now,
  }));
  const { error: upsertError } = await admin.from("newsletter_deliveries").upsert(rows, { onConflict: "issue_id,subscriber_id", ignoreDuplicates: true });
  if (upsertError) {
    return { ok: false, error: `발송은 됐지만 이력 기록에 실패했습니다 (${upsertError.message}). 중복 발송을 막기 위해 중단합니다. DB 확인 후 다시 시도하세요.` };
  }
  // 최초 배치에 검수용 사본 1통 (수신자별 BCC 대신) — 더미 토큰
  const bcc = bccAddress();
  if (done.size === 0 && bcc) {
    const copy = buildSubscriberMail(issue, { email: bcc, name: null, token: DUMMY_TOKEN });
    await sendEmail({ to: bcc, subject: `[발송 사본] ${copy.subject}`, html: copy.html });
  }
  const { count: sentCount } = await admin.from("newsletter_deliveries").select("id", { count: "exact", head: true }).eq("issue_id", id).eq("status", "sent");
  await admin
    .from("newsletter_issues")
    .update({ sent_count: sentCount ?? issue.sent_count, sent_at: issue.sent_at ?? now, updated_at: now })
    .eq("id", id);
  const failed = failedByIndex.size;
  return { ok: true, sent: batch.length - failed, failed, remaining: pending.length - batch.length, total };
}
