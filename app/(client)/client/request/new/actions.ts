"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/email/admin-alert";
import {
  matchingRequestSchema,
  normalizeBizRegNo,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";
import {
  MAX_FILE_SIZE,
  sanitizeFileName,
  validateUploadFile,
} from "@/lib/schemas/partner-application";
import type { Json } from "@/types/database";

export type RequestState =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | null;

function getAll(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(String);
}

// ── 임시저장(DRAFT) ──────────────────────────────────────────────
// CLAUDE.md: localStorage 금지 → 서버(matching_requests status=draft)에 보관.
export type DraftPayload = {
  id: string;
  brief: Record<string, unknown>;
};

async function currentClientId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .single<{ id: string }>();
  return data?.id ?? null;
}

// 가장 최근 작성 중(draft) 요청을 불러와 폼을 복원한다.
export async function loadDraft(): Promise<DraftPayload | null> {
  const clientId = await currentClientId();
  if (!clientId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("matching_requests")
    .select("id, brief")
    .eq("client_id", clientId)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; brief: Record<string, unknown> | null }>();
  if (!data) return null;
  return { id: data.id, brief: data.brief ?? {} };
}

// 멀티스텝 진행 중 자동 저장. 검증하지 않고 부분 데이터를 그대로 보관.
export async function saveDraft(
  draftId: string | null,
  brief: Record<string, unknown>,
): Promise<{ id: string } | { error: string }> {
  const clientId = await currentClientId();
  if (!clientId) return { error: "광고주 프로필을 찾을 수 없습니다." };
  const supabase = await createClient();

  const planned = (brief.planned_budgets ?? {}) as Record<string, number>;
  const budgetTotal = Object.values(planned).reduce(
    (s, v) => s + (Number(v) || 0),
    0,
  );
  const title =
    String(brief.brand_name ?? "").trim().slice(0, 200) || "작성 중인 매칭 요청";

  if (draftId) {
    const { error } = await supabase
      .from("matching_requests")
      .update({
        title,
        brief: brief as unknown as Json,
        budget_monthly: budgetTotal || null,
      })
      .eq("id", draftId)
      .eq("client_id", clientId)
      .eq("status", "draft");
    if (error) return { error: error.message };
    return { id: draftId };
  }

  const { data, error } = await supabase
    .from("matching_requests")
    .insert({
      client_id: clientId,
      title,
      brief: brief as unknown as Json,
      budget_monthly: budgetTotal || null,
      status: "draft",
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { error: error?.message ?? "임시저장 실패" };
  return { id: data.id };
}

export async function submitMatchingRequest(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
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
    marketing_goals: getAll(formData, "marketing_goals"),
    channels: getAll(formData, "channels"),
    duration: formData.get("duration"),
    kpis: getAll(formData, "kpis"),
    report_cycles: getAll(formData, "report_cycles"),
    meeting_cycles: getAll(formData, "meeting_cycles"),
    tools: getAll(formData, "tools"),
    preferred_agency: formData.get("preferred_agency"),
    avoided_agency: formData.get("avoided_agency") || undefined,
    payment_methods: getAll(formData, "payment_methods"),
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

  // 증빙 파일 검증 (필수)
  const proofFile = formData.get("ad_spend_proof");
  if (!(proofFile instanceof File) || proofFile.size === 0) {
    return {
      error: "지난 3개월 광고비 소진액 증빙 파일을 첨부해주세요. (필수)",
    };
  }
  if (proofFile.size > MAX_FILE_SIZE) {
    return { error: "증빙 파일은 10MB 이하여야 합니다." };
  }
  const fileError = validateUploadFile(proofFile);
  if (fileError) return { error: fileError };

  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .single<{ id: string }>();

  if (!client) {
    return {
      error: "광고주 프로필을 찾을 수 없습니다. 다시 로그인해주세요.",
    };
  }

  const data = parsed.data;

  // 협업 후 집행 예정 월평균 광고예산 (요청 매체별, 선택). planned_budget_<value>
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
    ad_spend_proof: null,
  };

  // 멀티스텝 임시저장에서 넘어온 경우 해당 draft 행을 제출 처리(중복 생성 방지).
  const draftId = String(formData.get("draft_id") || "").trim();
  let requestId: string;

  if (draftId) {
    const { error: updateError } = await supabase
      .from("matching_requests")
      .update({
        title: data.brand_name,
        brief: brief as unknown as Json,
        budget_monthly: budgetTotal || null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", draftId)
      .eq("client_id", client.id)
      .eq("status", "draft");
    if (updateError) {
      return { error: updateError.message };
    }
    requestId = draftId;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("matching_requests")
      .insert({
        client_id: client.id,
        title: data.brand_name,
        brief: brief as unknown as Json,
        budget_monthly: budgetTotal || null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !inserted) {
      return {
        error: insertError?.message ?? "요청 저장 중 오류가 발생했습니다.",
      };
    }
    requestId = inserted.id;
  }

  // 증빙 파일 업로드 (service_role)
  if (proofFile instanceof File && proofFile.size > 0) {
    const admin = createAdminClient();
    const path = `${client.id}/${requestId}/${sanitizeFileName(proofFile.name)}`;
    const { error } = await admin.storage
      .from("client-files")
      .upload(path, proofFile, {
        upsert: true,
        contentType: proofFile.type,
      });
    if (!error) {
      brief.ad_spend_proof = { name: proofFile.name, path };
      await admin
        .from("matching_requests")
        .update({ brief: brief as unknown as Json })
        .eq("id", requestId);
    }
  }

  // 운영자 필수 알림: 새 매칭요청 접수 (메일 + 인앱)
  await notifyAdmins({
    type: "request",
    title: "새 매칭 요청 접수",
    rows: [
      ["브랜드", data.brand_name],
      ["상호", data.company_name],
      ["카테고리", data.category],
      ["담당자", `${data.contact_name} (${data.email})`],
      [
        "월 예산 합계",
        budgetTotal ? `${budgetTotal.toLocaleString()}원` : "미입력/협의",
      ],
    ],
    link: `/admin/requests/${requestId}`,
    linkLabel: "요청 검토하기",
  });

  redirect(`/client/request/${requestId}?created=1`);
}
