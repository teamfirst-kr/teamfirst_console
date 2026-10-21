import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { bccAddress, sendEmail, sendEmailBatch } from "@/lib/email/resend";
import { appUrl, newsletterEmail, type NewsletterMailVariant } from "@/lib/email/newsletter";
import type { NewsletterIssueRow, NewsletterSubscriberRow } from "@/types/database";

export const BATCH_SIZE = 50; // Resend batch 한도 100 이하, 서버리스 타임아웃 여유
export const DUMMY_TOKEN = "0".repeat(48); // 테스트·검수·사본 메일용 (실제 구독자 토큰을 담지 않음)

// busy: 다른 워커가 발송 중인(선점만 하고 아직 결과 미기록) 구독자가 있어 이번 호출에서는 할 일이 없음 — 호출부는 반복을 멈춘다
export type SendBatchResult =
  | { ok: true; sent: number; failed: number; remaining: number; total: number; busy?: boolean }
  | { ok: false; error: string };

// 다른 워커가 선점 후 결과를 아직 기록하지 않은 행을 '진행 중'으로 보는 시간. 이보다 오래된 queued 행은
// (발송 후 기록 실패 등으로) 멈춘 것으로 보고 완료 판정을 막지 않는다 — 재발송은 하지 않는다.
export const IN_FLIGHT_MS = 3 * 60 * 1000;

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
// 중복 발송 방지: 발송 "전"에 newsletter_deliveries 에 status='queued' 행을 먼저 삽입해 자리를 선점한다(035).
// UNIQUE(issue_id, subscriber_id) 덕에 동시 실행(크론+수동, 크론 중복)에서도 한 워커만 삽입에 성공하고 그 구독자에게만 보낸다.
// 발송 후 queued → sent/failed 로 갱신. Resend 호출 자체가 실패하면 queued 행을 지워 다음 시도에 재발송,
// 발송은 됐는데 갱신에 실패하면 queued 로 남겨(=이력 있음) 재발송하지 않는다.
export async function sendIssueBatchCore(id: string): Promise<SendBatchResult> {
  const admin = createAdminClient();
  const issue = await loadIssueAdmin(id);
  if (!issue) return { ok: false, error: "호를 찾을 수 없습니다." };
  if (issue.status !== "published") return { ok: false, error: "공개(published)된 호만 발송할 수 있습니다." };

  const [{ data: subs, error: subsError }, { data: delivered, error: delError }] = await Promise.all([
    admin.from("newsletter_subscribers").select("id, email, name, token").eq("status", "subscribed").order("created_at", { ascending: true }),
    admin.from("newsletter_deliveries").select("subscriber_id, status, sent_at").eq("issue_id", id),
  ]);
  if (subsError) return { ok: false, error: `구독자 조회 실패: ${subsError.message}` };
  if (delError) return { ok: false, error: `발송 이력 조회 실패: ${delError.message}` };
  const done = new Set((delivered ?? []).map((d) => d.subscriber_id));
  const pending = ((subs ?? []) as Pick<NewsletterSubscriberRow, "id" | "email" | "name" | "token">[]).filter((s) => !done.has(s.id));
  const total = (subs ?? []).length;
  const now = new Date().toISOString();
  // 다른 워커가 발송 중인 행 (선점됐지만 결과 미기록, 최근 IN_FLIGHT_MS 이내) — 이 행이 남아 있으면 완료로 판정하지 않는다
  const inFlight = (delivered ?? []).filter((d) => d.status === "queued" && Date.now() - new Date(d.sent_at).getTime() < IN_FLIGHT_MS).length;
  if (pending.length === 0) {
    if (inFlight > 0) return { ok: true, sent: 0, failed: 0, remaining: inFlight, total, busy: true };
    await markLifecycle(id, issue, { completed: true, now });
    return { ok: true, sent: 0, failed: 0, remaining: 0, total };
  }

  // 1) 선점: 후보 배치를 queued 로 삽입 — 실제로 삽입된 행(=이 워커 몫)만 돌려받는다
  const candidates = pending.slice(0, BATCH_SIZE);
  const { data: claimedRows, error: claimError } = await admin
    .from("newsletter_deliveries")
    .upsert(
      candidates.map((s) => ({ issue_id: id, subscriber_id: s.id, status: "queued" as const, sent_at: now })),
      { onConflict: "issue_id,subscriber_id", ignoreDuplicates: true },
    )
    .select("subscriber_id");
  if (claimError) return { ok: false, error: `발송 선점 실패: ${claimError.message}` };
  const claimed = new Set((claimedRows ?? []).map((r) => r.subscriber_id));
  const batch = candidates.filter((s) => claimed.has(s.id));
  if (batch.length === 0) {
    // 다른 워커가 이 배치를 방금 가져감 — 완료로 오판하지 않도록 남은 수에 포함하고, 호출부는 반복을 멈춘다
    return { ok: true, sent: 0, failed: 0, remaining: pending.length + inFlight, total, busy: true };
  }

  // 2) 발송
  const mails = batch.map((s) => ({ sub: s, mail: buildSubscriberMail(issue, s) }));
  const r = await sendEmailBatch(mails.map((m) => ({ to: m.sub.email, subject: m.mail.subject, html: m.mail.html, headers: m.mail.headers })));
  if (!r.ok) {
    // Resend 호출 자체가 실패 → 선점 해제(다음 시도에 재발송)
    await admin
      .from("newsletter_deliveries")
      .delete()
      .eq("issue_id", id)
      .eq("status", "queued")
      .in("subscriber_id", batch.map((s) => s.id));
    if (r.skipped) return { ok: false, error: "RESEND_API_KEY가 설정되지 않아 발송할 수 없습니다." };
    return { ok: false, error: `발송 실패: ${r.error ?? "unknown"}` };
  }

  // 3) 결과 기록 (queued → sent/failed)
  const failedByIndex = new Map(r.failures.map((f) => [f.index, f.message]));
  const sentIds = batch.filter((_s, i) => !failedByIndex.has(i)).map((s) => s.id);
  const failedItems = batch.map((s, i) => ({ s, msg: failedByIndex.get(i) })).filter((x) => x.msg !== undefined);
  const doneAt = new Date().toISOString();
  let updateError: { message: string } | null = null;
  if (sentIds.length > 0) {
    const { error } = await admin.from("newsletter_deliveries").update({ status: "sent", sent_at: doneAt }).eq("issue_id", id).in("subscriber_id", sentIds);
    if (error) updateError = error;
  }
  for (const f of failedItems) {
    const { error } = await admin.from("newsletter_deliveries").update({ status: "failed", error: (f.msg ?? "").slice(0, 500), sent_at: doneAt }).eq("issue_id", id).eq("subscriber_id", f.s.id);
    if (error) updateError = updateError ?? error;
  }
  if (updateError) {
    // 메일은 나갔고 queued 행은 남아 있어 재발송되지는 않는다. 운영자에게 알리고 중단.
    return { ok: false, error: `발송은 됐지만 이력 갱신에 실패했습니다 (${updateError.message}). 해당 구독자는 queued 로 남아 재발송되지 않습니다. DB 확인 후 다시 시도하세요.` };
  }

  // 최초 배치에 검수용 사본 1통 (수신자별 BCC 대신) — 더미 토큰
  const bcc = bccAddress();
  if (done.size === 0 && bcc) {
    const copy = buildSubscriberMail(issue, { email: bcc, name: null, token: DUMMY_TOKEN });
    await sendEmail({ to: bcc, subject: `[발송 사본] ${copy.subject}`, html: copy.html });
  }
  // 다른 워커의 진행 중 행이 있었다면 그 워커(또는 다음 실행)가 완료를 판정한다
  const remaining = pending.length - batch.length + inFlight;
  await markLifecycle(id, issue, { completed: remaining === 0, now: doneAt });
  return { ok: true, sent: sentIds.length, failed: failedItems.length, remaining, total };
}

// 발송 수(이력에서 재계산)·시작/완료 시각 갱신 — 수동·자동 발송 공통
async function markLifecycle(id: string, issue: NewsletterIssueRow, opts: { completed: boolean; now: string }) {
  const admin = createAdminClient();
  const { count: sentCount } = await admin.from("newsletter_deliveries").select("id", { count: "exact", head: true }).eq("issue_id", id).eq("status", "sent");
  await admin
    .from("newsletter_issues")
    .update({
      sent_count: sentCount ?? issue.sent_count,
      sent_at: issue.sent_at ?? opts.now,
      send_started_at: issue.send_started_at ?? opts.now,
      ...(opts.completed && !issue.send_completed_at ? { send_completed_at: opts.now } : {}),
      updated_at: opts.now,
    })
    .eq("id", id);
}
