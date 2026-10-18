"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { appUrl } from "@/lib/email/newsletter";
import { formatKstDateTime, kstLocalToIso, MAX_TAGS, MAX_TEASERS, splitTags } from "@/lib/newsletter/highlight";
import { buildSubscriberMail, DUMMY_TOKEN, loadIssueAdmin, reviewEmailAddress, sendIssueBatchCore, type SendBatchResult } from "@/lib/newsletter/send";
import type { NewsletterCategory, NewsletterIssueRow } from "@/types/database";

export type IssueActionState = { error: string } | null;
export type { SendBatchResult };

const CATEGORIES: NewsletterCategory[] = ["media_update", "conference", "brand_trend", "content_trend", "ai_workflow", "general"];

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") throw new Error("운영자 권한이 필요합니다.");
}

// [승인·발송 예약]은 NEWSLETTER_APPROVER_EMAIL 이 설정돼 있으면 그 운영자만 (Cowork 계정과 분리할 때)
async function assertApprover(): Promise<string | null> {
  const allowed = process.env.NEWSLETTER_APPROVER_EMAIL?.trim().toLowerCase();
  if (!allowed) return null;
  const user = await getCurrentUser();
  if ((user?.email ?? "").toLowerCase() !== allowed) return "승인 권한이 있는 운영자 계정으로만 예약할 수 있습니다.";
  return null;
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
  const teasers = String(fd.get("email_teasers") ?? "")
    .split("\n")
    .map((t) => t.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, MAX_TEASERS);
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
    email_tags: splitTags(str("email_tags", 120)).slice(0, MAX_TAGS).join(",") || null,
    email_headline: str("email_headline", 120) || null,
    email_intro: String(fd.get("email_intro") ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 600) || null,
    email_teasers: teasers.length > 0 ? teasers : null,
    email_button_label: str("email_button_label", 40) || null,
    review_note: String(fd.get("review_note") ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 4000) || null,
    publish: fd.get("publish") === "on",
    intent: str("intent", 20), // "review" 면 저장 후 바로 검수 요청
  };
}

export async function createIssue(_prev: IssueActionState, fd: FormData): Promise<IssueActionState> {
  await assertAdmin();
  const f = readForm(fd);
  if (!f.title) return { error: "제목을 입력해주세요." };
  const supabase = await createClient();
  const { publish, intent, ...fields } = f;
  const { data, error } = await supabase
    .from("newsletter_issues")
    .insert({ ...fields, status: publish ? "published" : "draft", published_at: publish ? new Date().toISOString() : null })
    .select("id")
    .single();
  if (error) return { error: error.code === "23505" ? "같은 slug의 호가 이미 있습니다." : error.message };
  if (intent === "review") {
    const r = await requestReview(data.id);
    if (!r.ok) return { error: `저장은 됐지만 검수 요청에 실패했습니다: ${r.error}` };
  }
  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter");
  redirect(`/admin/newsletter/${data.id}${intent === "review" ? "?reviewed=1" : ""}`);
}

export async function updateIssue(id: string, _prev: IssueActionState, fd: FormData): Promise<IssueActionState> {
  await assertAdmin();
  const f = readForm(fd);
  if (!f.title) return { error: "제목을 입력해주세요." };
  const supabase = await createClient();
  const { data: cur } = await supabase.from("newsletter_issues").select("status, published_at, slug, sent_count").eq("id", id).maybeSingle();
  if (!cur) return { error: "호를 찾을 수 없습니다." };
  const { publish, intent, ...fields } = f;
  if (fields.slug !== cur.slug && cur.sent_count > 0) return { error: "이미 발송된 호의 slug는 변경할 수 없습니다 (메일 링크 보호)." };
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
  if (intent === "review") {
    const r = await requestReview(id);
    if (!r.ok) return { error: `저장은 됐지만 검수 요청에 실패했습니다: ${r.error}` };
  }
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

// 폼 내용 그대로 메일 HTML 미리보기 (저장하지 않음) — 어드민 작성 화면의 iframe 에 표시
export async function previewIssueEmail(fd: FormData): Promise<{ ok: true; html: string; subject: string } | { ok: false; error: string }> {
  await assertAdmin();
  const f = readForm(fd);
  const now = new Date().toISOString();
  const issue: NewsletterIssueRow = {
    id: "preview",
    slug: f.slug || "preview",
    issue_no: f.issue_no,
    title: f.title || "(제목 없음)",
    summary: f.summary,
    category: f.category,
    cover_url: f.cover_url,
    body_md: f.body_md,
    cta_title: f.cta_title,
    cta_body: f.cta_body,
    status: "draft",
    published_at: null,
    sent_at: null,
    sent_count: 0,
    email_tags: f.email_tags,
    email_headline: f.email_headline,
    email_intro: f.email_intro,
    email_teasers: f.email_teasers,
    email_button_label: f.email_button_label,
    review_note: f.review_note,
    review_requested_at: null,
    approved_at: null,
    send_scheduled_at: null,
    send_started_at: null,
    send_completed_at: null,
    created_at: now,
    updated_at: now,
  };
  const mail = buildSubscriberMail(issue, { email: "", name: null, token: DUMMY_TOKEN }, "subscriber");
  return { ok: true, html: mail.html, subject: mail.subject };
}

// ── 검수 요청 → 승인·예약 → (크론) 자동 발송 ──

// [검수 요청] — review_requested_at 기록 + 검수 메일(구독자 메일 그대로 + 상단 검수 메모·편집 링크)을 운영자에게
export async function requestReview(id: string): Promise<{ ok: boolean; error?: string; to?: string }> {
  await assertAdmin();
  const issue = await loadIssueAdmin(id);
  if (!issue) return { ok: false, error: "호를 찾을 수 없습니다." };
  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { error } = await admin.from("newsletter_issues").update({ review_requested_at: now, updated_at: now }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  const to = reviewEmailAddress();
  const mail = buildSubscriberMail({ ...issue, review_requested_at: now }, { email: to, name: null, token: DUMMY_TOKEN }, "review", {
    note: issue.review_note,
    adminUrl: `${appUrl()}/admin/newsletter/${issue.id}`,
    requestedAt: `${formatKstDateTime(now)} KST`,
  });
  const r = await sendEmail({ to, subject: mail.subject, html: mail.html });
  if (!r.ok && !r.skipped) return { ok: false, error: `검수 메일 발송 실패: ${r.error ?? "unknown"}` };
  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/${id}`);
  return { ok: true, to };
}

// [승인·발송 예약] — 운영자 전용. 예약 시각(KST 입력)에 크론이 공개 + 발송.
export async function approveAndSchedule(id: string, kstLocal: string): Promise<{ ok: boolean; error?: string; scheduledAt?: string }> {
  await assertAdmin();
  const denied = await assertApprover();
  if (denied) return { ok: false, error: denied };
  const iso = kstLocalToIso(kstLocal);
  if (!iso) return { ok: false, error: "예약 시각을 확인해주세요." };
  if (new Date(iso).getTime() < Date.now() - 60_000) return { ok: false, error: "과거 시각으로는 예약할 수 없습니다." };
  const issue = await loadIssueAdmin(id);
  if (!issue) return { ok: false, error: "호를 찾을 수 없습니다." };
  if (issue.send_started_at) return { ok: false, error: "이미 발송이 시작된 호입니다." };
  if (!issue.title.trim() || !issue.body_md.trim()) return { ok: false, error: "제목과 본문이 있어야 예약할 수 있습니다." };
  const now = new Date().toISOString();
  const { error } = await createAdminClient().from("newsletter_issues").update({ approved_at: now, send_scheduled_at: iso, updated_at: now }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/${id}`);
  return { ok: true, scheduledAt: iso };
}

// 예약 취소 — 발송 시작 전까지만
export async function cancelSchedule(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const denied = await assertApprover();
  if (denied) return { ok: false, error: denied };
  const issue = await loadIssueAdmin(id);
  if (!issue) return { ok: false, error: "호를 찾을 수 없습니다." };
  if (issue.send_started_at) return { ok: false, error: "이미 발송이 시작돼 취소할 수 없습니다." };
  const now = new Date().toISOString();
  const { error } = await createAdminClient().from("newsletter_issues").update({ approved_at: null, send_scheduled_at: null, updated_at: now }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/${id}`);
  return { ok: true };
}

// 테스트 발송 — 로그인한 운영자 본인 메일로
export async function sendTestIssue(id: string): Promise<{ ok: boolean; error?: string; to?: string }> {
  await assertAdmin();
  const user = await getCurrentUser();
  if (!user?.email) return { ok: false, error: "운영자 이메일을 확인할 수 없습니다." };
  const issue = await loadIssueAdmin(id);
  if (!issue) return { ok: false, error: "호를 찾을 수 없습니다." };
  const mail = buildSubscriberMail(issue, { email: user.email, name: "운영자", token: DUMMY_TOKEN }, "test");
  const r = await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
  if (!r.ok) return { ok: false, error: r.skipped ? "RESEND_API_KEY가 설정되지 않아 발송을 건너뛰었습니다." : r.error ?? "발송 실패" };
  return { ok: true, to: user.email };
}

// 비상용 수동 발송 (어드민 버튼이 remaining=0 까지 반복 호출)
export async function sendIssueBatch(id: string): Promise<SendBatchResult> {
  await assertAdmin();
  const r = await sendIssueBatchCore(id);
  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/${id}`);
  return r;
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
