"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { matchingRequestRejectedEmail, rfpArrivedEmail } from "@/lib/email/templates";
import { notify, notifyMany } from "@/lib/notifications";
import { formatDeadline, rfpDeadlineFrom, todayKst } from "@/lib/rfp";
import {
  matchingRequestSchema,
  normalizeBizRegNo,
  REQUEST_MEDIA,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";
import type { Json } from "@/types/database";
import type { RequestStatus } from "@/types/database";

const MEDIA_LABEL = Object.fromEntries(
  REQUEST_MEDIA.map((m) => [m.value, m.label]),
);

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") throw new Error("운영자 권한이 필요합니다.");
}

export type RfpResult =
  | { ok: true; message: string; count: number }
  | { ok: false; error: string };

export async function sendRfp(
  requestId: string,
  partnerIds: string[],
): Promise<RfpResult> {
  await assertAdmin();

  if (!partnerIds || partnerIds.length === 0) {
    return { ok: false, error: "발송할 대행사를 1곳 이상 선택해주세요." };
  }

  const supabase = await createClient();

  const { data: request, error: reqError } = await supabase
    .from("matching_requests")
    .select("id, title, brief, budget_monthly, status, rfp_deadline")
    .eq("id", requestId)
    .single();

  if (reqError || !request) {
    return { ok: false, error: "요청을 찾을 수 없습니다." };
  }
  if (["rejected", "cancelled", "closed_won", "closed_lost"].includes(request.status)) {
    return { ok: false, error: "종료(반려·취소·마감)된 요청에는 RFP를 발송할 수 없습니다." };
  }

  // 입점 완료(contracted) 대행사 중, 운영자가 선택한 대행사에게만 발송.
  // (기본값은 화면에서 전원 선택. 특정 대행사 선택/제외 가능)
  const idSet = new Set(partnerIds);
  const { data: allPartners, error: partnerError } = await supabase
    .from("partners")
    .select("id, company_name, contact_email, user_id")
    .eq("status", "contracted");

  if (partnerError) {
    return { ok: false, error: partnerError.message };
  }
  const partners = (allPartners ?? []).filter((p) => idSet.has(p.id));

  if (partners.length === 0) {
    return {
      ok: false,
      error: "선택한 대행사를 찾을 수 없습니다. 목록을 새로고침한 뒤 다시 시도해주세요.",
    };
  }

  // rfp_notifications 생성 (중복은 무시 — 재발송 안전)
  const rows = partners.map((p) => ({
    request_id: requestId,
    partner_id: p.id,
    email_sent: false,
  }));
  const { error: insertError } = await supabase
    .from("rfp_notifications")
    .upsert(rows, { onConflict: "request_id,partner_id", ignoreDuplicates: true });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  // 상태 전환: submitted/draft → rfp_sent. 지원 기한은 최초 발행일(KST) + 5영업일 (추가 발송 시 유지)
  const deadline = request.rfp_deadline ?? rfpDeadlineFrom(todayKst());
  await supabase
    .from("matching_requests")
    .update({
      status: "rfp_sent" satisfies RequestStatus,
      rfp_sent_at: new Date().toISOString(),
      rfp_deadline: deadline,
    })
    .eq("id", requestId);

  // 대행사 전원에게 RFP 도착 알림 메일 발송 (앱 내 RFP로 연결).
  // n8n/슬라이드 없이 플랫폼에서 RFP를 열람한다.
  const brief = (request.brief ?? {}) as MatchingBrief;
  const rfpUrl = `${appUrl()}/partner/rfp/${requestId}`;
  let mailed = 0;
  for (const p of partners) {
    const mail = rfpArrivedEmail({
      companyName: p.company_name,
      brandName: brief.brand_name ?? request.title,
      category: brief.category ?? "-",
      website: brief.website,
      productIntro: brief.product_intro,
      reason: brief.reason,
      budget: request.budget_monthly,
      duration: brief.duration,
      channels: brief.channels?.map((c) => MEDIA_LABEL[c] ?? c),
      marketingGoals: brief.marketing_goals,
      kpis: brief.kpis,
      preferredAgency: brief.preferred_agency,
      deadline,
      rfpUrl,
    });
    const r = await sendEmail({ to: p.contact_email, ...mail });
    if (r.ok) mailed++;
  }
  if (mailed > 0) {
    await supabase
      .from("rfp_notifications")
      .update({ email_sent: true })
      .eq("request_id", requestId)
      .in(
        "partner_id",
        partners.map((p) => p.id),
      );
  }

  // 인앱 알림
  await notifyMany(
    partners.map((p) => p.user_id),
    {
      type: "rfp",
      title: "새 RFP가 도착했습니다",
      body: `${brief.brand_name ?? request.title} · ${brief.category ?? ""} · 지원 마감 ${formatDeadline(deadline)}`,
      link: `/partner/rfp/${requestId}`,
    },
  );

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  return {
    ok: true,
    message: `RFP를 ${partners.length}개 대행사에 발송했습니다. (메일 ${mailed}건)`,
    count: partners.length,
  };
}

export async function setRequestStatus(
  requestId: string,
  status: RequestStatus,
): Promise<RfpResult> {
  await assertAdmin();
  const supabase = await createClient();

  // 정합성 가드: '지원 수집 중'은 RFP가 실제로 발송된(=rfp_notifications 존재) 뒤에만 가능.
  // (RFP 미발송인데 수집 단계로 넘어가면 대행사 '도착한 RFP'에 안 보이는 불일치 발생)
  if (status === "collecting") {
    const { count } = await supabase
      .from("rfp_notifications")
      .select("id", { count: "exact", head: true })
      .eq("request_id", requestId);
    if ((count ?? 0) === 0) {
      return {
        ok: false,
        error: "RFP를 먼저 발송한 뒤에 지원 수집 단계로 전환할 수 있습니다.",
      };
    }
  }

  const { error } = await supabase
    .from("matching_requests")
    .update({ status })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  return { ok: true, message: "상태를 변경했습니다.", count: 0 };
}

// 접수된 매칭 요청 반려: 후보를 광고주에게 전달하기 전 단계에서만 허용.
// 반려 시 사유를 저장하고 광고주에게 메일·인앱 알림을 보낸다.
const REJECTABLE_STATUSES: RequestStatus[] = [
  "submitted",
  "rfp_sent",
  "collecting",
  "curating",
];

export async function rejectRequest(
  requestId: string,
  reason: string,
): Promise<RfpResult> {
  await assertAdmin();

  const trimmed = reason.trim();
  if (!trimmed) {
    return { ok: false, error: "반려 사유를 입력해주세요." };
  }

  const supabase = await createClient();

  const { data: request } = await supabase
    .from("matching_requests")
    .select("id, title, brief, status, client_id")
    .eq("id", requestId)
    .single<{
      id: string;
      title: string;
      brief: MatchingBrief | null;
      status: RequestStatus;
      client_id: string;
    }>();
  if (!request) return { ok: false, error: "요청을 찾을 수 없습니다." };

  if (!REJECTABLE_STATUSES.includes(request.status)) {
    return {
      ok: false,
      error: "후보 전달 전 단계(검수 대기~후보 선정 중)에서만 반려할 수 있습니다.",
    };
  }

  const { error } = await supabase
    .from("matching_requests")
    .update({
      status: "rejected" satisfies RequestStatus,
      reject_reason: trimmed,
      rejected_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };

  // 광고주 통보 (메일 + 인앱). 통보 실패가 반려 자체를 되돌리지는 않는다.
  const brief = (request.brief ?? {}) as MatchingBrief;
  const brandName = brief.brand_name ?? request.title;
  try {
    if (brief.email) {
      const mail = matchingRequestRejectedEmail({
        brandName,
        reason: trimmed,
        requestUrl: `${appUrl()}/client/request/${requestId}`,
      });
      await sendEmail({ to: brief.email, ...mail });
    }
    const { data: client } = await supabase
      .from("clients")
      .select("user_id")
      .eq("id", request.client_id)
      .maybeSingle<{ user_id: string | null }>();
    await notify(client?.user_id, {
      type: "request_rejected",
      title: "매칭 요청이 반려되었습니다",
      body: `${brandName} · 사유: ${trimmed}`,
      link: `/client/request/${requestId}`,
    });
  } catch {
    // 통보 실패 무시 (반려 상태는 이미 반영됨)
  }

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  return { ok: true, message: "요청을 반려하고 광고주에게 통보했습니다.", count: 0 };
}

// ── 접수된 요청(RFP) 운영자 수정 ─────────────────────────────────────
// 광고주가 수정 요청한 내용을 운영자가 대신 반영한다. 광고주 제출과 동일한
// 스키마로 검증해 데이터 일관성 유지. 증빙 파일(ad_spend_proof)은 보존.
export type EditRequestState =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | null;

function getAllStrings(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(String);
}

export async function updateRequestBrief(
  _prev: EditRequestState,
  formData: FormData,
): Promise<EditRequestState> {
  await assertAdmin();

  const requestId = String(formData.get("request_id") || "").trim();
  if (!requestId) return { error: "요청 ID가 없습니다." };

  const raw = {
    company_name: formData.get("company_name"),
    biz_reg_no: formData.get("biz_reg_no"),
    representative: formData.get("representative"),
    brand_name: formData.get("brand_name"),
    contact_name: formData.get("contact_name"),
    contact_title: formData.get("contact_title"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    website: formData.get("website") || undefined,
    category: formData.get("category"),
    product_intro: formData.get("product_intro"),
    reason: formData.get("reason"),
    marketing_goals: getAllStrings(formData, "marketing_goals"),
    channels: getAllStrings(formData, "channels"),
    duration: formData.get("duration"),
    kpis: getAllStrings(formData, "kpis"),
    report_cycles: getAllStrings(formData, "report_cycles"),
    meeting_cycles: getAllStrings(formData, "meeting_cycles"),
    tools: getAllStrings(formData, "tools"),
    preferred_agency: formData.get("preferred_agency"),
    avoided_agency: formData.get("avoided_agency") || undefined,
    payment_methods: getAllStrings(formData, "payment_methods"),
    analysis_access_intent: formData.get("analysis_access_intent") === "on",
  };

  const parsed = matchingRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return { error: "입력값을 다시 확인해주세요.", fieldErrors };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("matching_requests")
    .select("id, brief")
    .eq("id", requestId)
    .single<{ id: string; brief: MatchingBrief | null }>();
  if (!existing) return { error: "요청을 찾을 수 없습니다." };

  const data = parsed.data;

  // 매체별 집행 예정 예산 (선택 매체만, planned_budget_<value>)
  const plannedBudgets: Record<string, number> = {};
  for (const ch of data.channels) {
    const n = Number(
      String(formData.get(`planned_budget_${ch}`) ?? "").replace(/[^\d]/g, ""),
    );
    if (n > 0) plannedBudgets[ch] = n;
  }
  const budgetTotal = Object.values(plannedBudgets).reduce((s, v) => s + v, 0);

  const brief: MatchingBrief = {
    company_name: data.company_name,
    biz_reg_no: normalizeBizRegNo(data.biz_reg_no),
    representative: data.representative,
    brand_name: data.brand_name,
    contact_name: data.contact_name,
    contact_title: data.contact_title,
    email: data.email,
    phone: data.phone,
    website: data.website || null,
    category: data.category,
    product_intro: data.product_intro,
    reason: data.reason,
    marketing_goals: data.marketing_goals,
    channels: data.channels,
    duration: data.duration,
    kpis: data.kpis,
    report_cycles: data.report_cycles,
    meeting_cycles: data.meeting_cycles,
    tools: data.tools,
    preferred_agency: data.preferred_agency,
    avoided_agency: data.avoided_agency ?? null,
    payment_methods: data.payment_methods,
    analysis_access_intent: data.analysis_access_intent ?? false,
    planned_budgets: plannedBudgets,
    // 증빙 파일은 광고주 제출본 유지 (운영자 수정에서 재업로드 없음)
    ad_spend_proof: existing.brief?.ad_spend_proof ?? null,
  };

  const { error } = await supabase
    .from("matching_requests")
    .update({
      title: data.brand_name,
      brief: brief as unknown as Json,
      budget_monthly: budgetTotal || null,
    })
    .eq("id", requestId);
  if (error) return { error: error.message };

  // 요청 내용을 보는 모든 화면 갱신 (어드민·광고주·파트너 RFP·PDF)
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  revalidatePath(`/client/request/${requestId}`);
  revalidatePath(`/partner/rfp/${requestId}`);
  revalidatePath(`/rfp/${requestId}/print`);

  redirect(`/admin/requests/${requestId}`);
}
