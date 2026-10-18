"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { bccAddress, sendEmail, sendEmailBatch } from "@/lib/email/resend";
import { appUrl, newsletterEmail } from "@/lib/email/newsletter";
import type { NewsletterCategory, NewsletterIssueRow, NewsletterSubscriberRow } from "@/types/database";

export type IssueActionState = { error: string } | null;
export type SendBatchResult =
  | { ok: true; sent: number; failed: number; remaining: number; total: number }
  | { ok: false; error: string };

const CATEGORIES: NewsletterCategory[] = ["media_update", "conference", "brand_trend", "content_trend", "ai_workflow", "general"];
const BATCH_SIZE = 50; // Resend batch 한도 100 이하, 서버리스 타임아웃 여유

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") throw new Error("운영자 권한이 필요합니다.");
}

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  return base || `issue-${Math.abs(h)}`;
}

function readForm(fd: FormData) {
  const str = (k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
  const title = str("title", 200);
  const slugInput = str("slug", 120);
  const categoryRaw = str("category", 30);
  const issueNoRaw = str("issue_no", 10);
  return {
    title,
    slug: slugInput ? slugify(slugInput) : slugify(title),
    issue_no: issueNoRaw ? Number(issueNoRaw) || null : null,
    summary: str("summary", 400) || null,
    category: (CATEGORIES.includes(categoryRaw as NewsletterCategory) ? categoryRaw : "general") as NewsletterCategory,
    cover_url: str("cover_url", 500) || null,
    body_md: String(fd.get("body_md") ?? "").replace(/\r\n?/g, "\n").slice(0, 60_000),
    cta_title: str("cta_title", 120) || null,
    cta_body: str("cta_body", 500) || null,
    publish: fd.get("publish") === "on",
  };
}

export async function createIssue(_prev: IssueActionState, fd: FormData): Promise<IssueActionState> {
  await assertAdmin();
  const f = readForm(fd);
  if (!f.title) return { error: "제목을 입력해주세요." };
  const supabase = await createClient();
  const { publish, ...fields } = f;
  const { data, error } = await supabase
    .from("newsletter_issues")
    .insert({ ...fields, status: publish ? "published" : "draft", published_at: publish ? new Date().toISOString() : null })
    .select("id")
    .single();
  if (error) return { error: error.code === "23505" ? "같은 slug의 호가 이미 있습니다." : error.message };
  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");
  redirect(`/admin/newsletter/${data.id}`);
}

export async function updateIssue(id: string, _prev: IssueActionState, fd: FormData): Promise<IssueActionState> {
  await assertAdmin();
  const f = readForm(fd);
  if (!f.title) return { error: "제목을 입력해주세요." };
  const supabase = await createClient();
  const { data: cur } = await supabase.from("newsletter_issues").select("status, published_at, slug").eq("id", id).maybeSingle();
  if (!cur) return { error: "호를 찾을 수 없습니다." };
  const { publish, ...fields } = f;
  const { error } = await supabase
    .from("newsletter_issues")
    .update({
      ...fields,
      status: publish ? "published" : "draft",
      published_at: publish ? (cur.published_at ?? new Date().toISOString()) : cur.published_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.code === "23505" ? "같은 slug의 호가 이미 있습니다." : error.message };
  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/${id}`);
  revalidatePath("/newsletter");
  revalidatePath(`/newsletter/${cur.slug}`);
  revalidatePath(`/newsletter/${f.slug}`);
  return null;
}

export async function deleteIssue(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { data: cur } = await supabase.from("newsletter_issues").select("sent_count").eq("id", id).maybeSingle();
  if (!cur) return { ok: false, error: "호를 찾을 수 없습니다." };
  if (cur.sent_count > 0) return { ok: false, error: "이미 발송된 호는 삭제할 수 없습니다. 비공개(초안)로 전환하세요." };
  const { error } = await supabase.from("newsletter_issues").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");
  redirect("/admin/newsletter");
}

// 033 이후 본문 컬럼(body_md·cta_*)은 세션 클라이언트로 읽을 수 없어 운영자 확인 뒤 service_role 로 읽는다
async function loadIssueForAdmin(id: string): Promise<NewsletterIssueRow | null> {
  const { data } = await createAdminClient().from("newsletter_issues").select("*").eq("id", id).maybeSingle();
  return (data as NewsletterIssueRow | null) ?? null;
}

function buildMail(issue: NewsletterIssueRow, sub: Pick<NewsletterSubscriberRow, "email" | "name" | "token">) {
  const base = appUrl();
  const unsubscribeUrl = `${base}/newsletter/unsubscribe?token=${sub.token}`;
  const mail = newsletterEmail({
    issue,
    recipientName: sub.name,
    unsubscribeUrl,
    webUrl: `${base}/newsletter/open?t=${sub.token}&slug=${encodeURIComponent(issue.slug)}`,
  });
  // RFC 8058 원클릭 수신거부 (Gmail/Yahoo 대량 발신 요건)
  const headers = {
    "List-Unsubscribe": `<${base}/api/newsletter/unsubscribe?token=${sub.token}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
  return { ...mail, headers };
}

// 테스트 발송 — 로그인한 운영자 본인 메일로 (실제 구독자 발송 전 확인용)
export async function sendTestIssue(id: string): Promise<{ ok: boolean; error?: string; to?: string }> {
  await assertAdmin();
  const user = await getCurrentUser();
  if (!user?.email) return { ok: false, error: "운영자 이메일을 확인할 수 없습니다." };
  const issue = await loadIssueForAdmin(id);
  if (!issue) return { ok: false, error: "호를 찾을 수 없습니다." };
  const mail = buildMail(issue, { email: user.email, name: "운영자", token: "0".repeat(48) });
  const r = await sendEmail({ to: user.email, subject: `[테스트] ${mail.subject}`, html: mail.html });
  if (!r.ok) return { ok: false, error: r.skipped ? "RESEND_API_KEY가 설정되지 않아 발송을 건너뛰었습니다." : r.error ?? "발송 실패" };
  return { ok: true, to: user.email };
}

// 구독자 발송 — 아직 발송 이력이 없는 구독자에게 BATCH_SIZE명씩. 클라이언트가 remaining=0 까지 반복 호출한다.
// 발송 이력(newsletter_deliveries)이 유니크라 중복 발송되지 않고, 중단돼도 이어서 보낼 수 있다.
// 조회·이력 기록 오류는 즉시 중단(중복 발송 방지). 불량 주소는 permissive 검증으로 'failed' 이력을 남겨 재시도 대상에서 제외.
export async function sendIssueBatch(id: string): Promise<SendBatchResult> {
  await assertAdmin();
  const supabase = await createClient();
  const issue = await loadIssueForAdmin(id);
  if (!issue) return { ok: false, error: "호를 찾을 수 없습니다." };
  if (issue.status !== "published") return { ok: false, error: "공개(published)된 호만 발송할 수 있습니다. 먼저 저장 시 '공개'를 체크하세요." };

  const [{ data: subs, error: subsError }, { data: delivered, error: delError }] = await Promise.all([
    supabase.from("newsletter_subscribers").select("id, email, name, token").eq("status", "subscribed").order("created_at", { ascending: true }),
    supabase.from("newsletter_deliveries").select("subscriber_id").eq("issue_id", id),
  ]);
  if (subsError) return { ok: false, error: `구독자 조회 실패: ${subsError.message}` };
  if (delError) return { ok: false, error: `발송 이력 조회 실패: ${delError.message}` };
  const done = new Set((delivered ?? []).map((d) => d.subscriber_id));
  const pending = ((subs ?? []) as Pick<NewsletterSubscriberRow, "id" | "email" | "name" | "token">[]).filter((s) => !done.has(s.id));
  const total = (subs ?? []).length;
  if (pending.length === 0) return { ok: true, sent: 0, failed: 0, remaining: 0, total };

  const batch = pending.slice(0, BATCH_SIZE);
  const mails = batch.map((s) => ({ sub: s, mail: buildMail(issue, s) }));
  const r = await sendEmailBatch(mails.map((m) => ({ to: m.sub.email, subject: m.mail.subject, html: m.mail.html, headers: m.mail.headers })));
  if (!r.ok) {
    if (r.skipped) return { ok: false, error: "RESEND_API_KEY가 설정되지 않아 발송할 수 없습니다." };
    // 배치 전체 실패 — 이력은 남기지 않아 다음 시도에 재발송
    return { ok: false, error: `발송 실패: ${r.error ?? "unknown"}` };
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
  const { error: upsertError } = await supabase.from("newsletter_deliveries").upsert(rows, { onConflict: "issue_id,subscriber_id", ignoreDuplicates: true });
  if (upsertError) {
    // 메일은 이미 나갔는데 이력을 못 남긴 상태 — 반복 발송을 막기 위해 즉시 중단하고 운영자에게 알린다
    return { ok: false, error: `발송은 됐지만 이력 기록에 실패했습니다 (${upsertError.message}). 중복 발송을 막기 위해 중단합니다. DB 확인 후 다시 시도하세요.` };
  }
  // 최초 배치에 검수용 사본 1통 (수신자별 BCC 대신) — 실제 구독자 토큰이 담기지 않도록 운영자 더미 토큰으로
  const bcc = bccAddress();
  if (done.size === 0 && bcc) {
    const copy = buildMail(issue, { email: bcc, name: null, token: "0".repeat(48) });
    await sendEmail({ to: bcc, subject: `[발송 사본] ${copy.subject}`, html: copy.html });
  }
  // 발송 수는 증가분 합산이 아니라 이력 테이블에서 다시 센다 (동시 발송·재시도에도 정확)
  const { count: sentCount } = await supabase.from("newsletter_deliveries").select("id", { count: "exact", head: true }).eq("issue_id", id).eq("status", "sent");
  await createAdminClient()
    .from("newsletter_issues")
    .update({ sent_count: sentCount ?? issue.sent_count, sent_at: issue.sent_at ?? now, updated_at: now })
    .eq("id", id);
  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/${id}`);
  const failed = failedByIndex.size;
  return { ok: true, sent: batch.length - failed, failed, remaining: pending.length - batch.length, total };
}

// ── 구독자 관리 ──
export async function setSubscriberStatus(id: string, status: "subscribed" | "unsubscribed"): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({ status, unsubscribed_at: status === "unsubscribed" ? now : null, updated_at: now })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/newsletter/subscribers");
  revalidatePath("/admin/newsletter");
  return { ok: true };
}

export async function deleteSubscriber(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/newsletter/subscribers");
  revalidatePath("/admin/newsletter");
  return { ok: true };
}
