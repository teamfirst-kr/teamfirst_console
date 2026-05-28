"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";
import {
  rfpApplicationSchema,
  type ProposalMeta,
} from "@/lib/schemas/rfp-application";
import type { Json } from "@/types/database";

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
    team_composition: formData.get("team_composition") || undefined,
    similar_cases: formData.get("similar_cases") || undefined,
    differentiation: formData.get("differentiation") || undefined,
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

  // 본인에게 발송된 RFP인지 확인
  const { data: notification } = await supabase
    .from("rfp_notifications")
    .select("id")
    .eq("request_id", requestId)
    .eq("partner_id", partnerId)
    .maybeSingle();
  if (!notification) {
    return { error: "이 RFP에 지원할 권한이 없습니다." };
  }

  const data = parsed.data;
  const proposal: ProposalMeta = {
    approach: data.approach,
    team_composition: data.team_composition ?? null,
    similar_cases: data.similar_cases ?? null,
    differentiation: data.differentiation ?? null,
  };

  const { error } = await supabase.from("applications").insert({
    request_id: requestId,
    partner_id: partnerId,
    proposal: proposal as unknown as Json,
    quote_monthly: data.quote_monthly,
    start_available: data.start_available ?? null,
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
