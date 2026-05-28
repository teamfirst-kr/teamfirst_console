"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  matchingRequestSchema,
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

export async function submitMatchingRequest(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const raw = {
    brand_name: formData.get("brand_name"),
    contact_title: formData.get("contact_title"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    website: formData.get("website") || undefined,
    category: formData.get("category"),
    product_intro: formData.get("product_intro"),
    reason: formData.get("reason"),
    marketing_goals: getAll(formData, "marketing_goals"),
    channels: getAll(formData, "channels"),
    budget_monthly: formData.get("budget_monthly"),
    duration: formData.get("duration"),
    kpis: getAll(formData, "kpis"),
    report_cycles: getAll(formData, "report_cycles"),
    meeting_cycles: getAll(formData, "meeting_cycles"),
    tools: getAll(formData, "tools"),
    preferred_agency: formData.get("preferred_agency"),
    avoided_agency: formData.get("avoided_agency") || undefined,
    payment_methods: getAll(formData, "payment_methods"),
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

  // 증빙 파일 검증
  const proofFile = formData.get("ad_spend_proof");
  if (proofFile instanceof File && proofFile.size > 0) {
    if (proofFile.size > MAX_FILE_SIZE) {
      return { error: "증빙 파일은 10MB 이하여야 합니다." };
    }
    const fileError = validateUploadFile(proofFile);
    if (fileError) return { error: fileError };
  }

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
  const brief: MatchingBrief = {
    brand_name: data.brand_name,
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
    ad_spend_proof: null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("matching_requests")
    .insert({
      client_id: client.id,
      title: data.brand_name,
      brief: brief as unknown as Json,
      budget_monthly: data.budget_monthly,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !inserted) {
    return {
      error:
        insertError?.message ?? "요청 저장 중 오류가 발생했습니다.",
    };
  }

  // 증빙 파일 업로드 (service_role)
  if (proofFile instanceof File && proofFile.size > 0) {
    const admin = createAdminClient();
    const path = `${client.id}/${inserted.id}/${sanitizeFileName(proofFile.name)}`;
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
        .eq("id", inserted.id);
    }
  }

  redirect(`/client/request/${inserted.id}?created=1`);
}
