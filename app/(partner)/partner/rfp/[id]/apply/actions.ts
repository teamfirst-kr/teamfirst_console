"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";
import {
  rfpApplicationSchema,
  type ProposalAttachment,
  type ProposalMeta,
} from "@/lib/schemas/rfp-application";
import type { Json } from "@/types/database";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 5;
const ATTACHMENT_BUCKET = "partner-files";

export type ApplyRfpState =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | null;

export async function submitRfpApplication(
  requestId: string,
  _prev: ApplyRfpState,
  formData: FormData,
): Promise<ApplyRfpState> {
  const raw = {
    approach: formData.get("approach"),
    past_clients: formData.get("past_clients"),
    strengths_weaknesses: formData.get("strengths_weaknesses") || undefined,
    differentiation: formData.get("differentiation") || undefined,
    team_composition: formData.get("team_composition") || undefined,
    quote_monthly: formData.get("quote_monthly"),
    start_available: formData.get("start_available") || undefined,
  };

  const parsed = rfpApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return { error: "입력값을 다시 확인해주세요.", fieldErrors };
  }

  const partnerId = await getCurrentPartnerId();
  if (!partnerId) {
    return { error: "파트너 정보를 찾을 수 없습니다. 다시 로그인해주세요." };
  }

  const supabase = await createClient();

  const { data: notification } = await supabase
    .from("rfp_notifications")
    .select("id")
    .eq("request_id", requestId)
    .eq("partner_id", partnerId)
    .maybeSingle();
  if (!notification) {
    return { error: "이 RFP에 지원할 권한이 없습니다." };
  }

  const files = formData
    .getAll("attachments")
    .filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length > MAX_FILES) {
    return {
      error: `첨부 파일은 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`,
      fieldErrors: { attachments: [`최대 ${MAX_FILES}개`] },
    };
  }
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      return {
        error: `파일 한 개는 20MB를 넘을 수 없습니다: ${f.name}`,
        fieldErrors: { attachments: ["파일 크기 초과"] },
      };
    }
  }

  const attachments: ProposalAttachment[] = [];
  for (const f of files) {
    const safeName = f.name.replace(/[^\w.\-가-힣]/g, "_");
    const path = `applications/${requestId}/${partnerId}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(path, f, { upsert: false, contentType: f.type || undefined });
    if (upErr) {
      return { error: `첨부 업로드 실패: ${upErr.message}` };
    }
    attachments.push({ name: f.name, url: path, size: f.size });
  }

  const data = parsed.data;
  const proposal: ProposalMeta = {
    approach: data.approach,
    past_clients: data.past_clients,
    strengths_weaknesses: data.strengths_weaknesses ?? null,
    differentiation: data.differentiation ?? null,
    team_composition: data.team_composition ?? null,
  };

  const { error } = await supabase.from("applications").insert({
    request_id: requestId,
    partner_id: partnerId,
    proposal: proposal as unknown as Json,
    quote_monthly: data.quote_monthly,
    start_available: data.start_available ?? null,
    attachments:
      attachments.length > 0 ? (attachments as unknown as Json) : null,
    status: "submitted",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 이 RFP에 지원하셨습니다." };
    }
    return { error: error.message };
  }

  redirect(`/partner/rfp/${requestId}?applied=1`);
}
