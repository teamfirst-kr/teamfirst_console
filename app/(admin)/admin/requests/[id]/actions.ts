"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { triggerN8n } from "@/lib/webhooks/n8n";
import type { MatchingBrief } from "@/lib/schemas/matching-request";
import type { RequestStatus } from "@/types/database";

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") throw new Error("운영자 권한이 필요합니다.");
}

export type RfpResult =
  | { ok: true; message: string; count: number }
  | { ok: false; error: string };

export async function sendRfp(requestId: string): Promise<RfpResult> {
  await assertAdmin();
  const supabase = await createClient();

  const { data: request, error: reqError } = await supabase
    .from("matching_requests")
    .select("id, title, brief, budget_monthly, status")
    .eq("id", requestId)
    .single();

  if (reqError || !request) {
    return { ok: false, error: "요청을 찾을 수 없습니다." };
  }

  // 입점 완료(contracted) 대행사 전원 조회 (CLAUDE.md: 카테고리 필터 없음)
  const { data: partners, error: partnerError } = await supabase
    .from("partners")
    .select("id")
    .eq("status", "contracted");

  if (partnerError) {
    return { ok: false, error: partnerError.message };
  }
  if (!partners || partners.length === 0) {
    return {
      ok: false,
      error: "발송 대상 대행사가 없습니다. 먼저 파트너 입점을 완료해주세요.",
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

  // 상태 전환: submitted/draft → rfp_sent
  await supabase
    .from("matching_requests")
    .update({
      status: "rfp_sent" satisfies RequestStatus,
      rfp_sent_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  // n8n 트리거 (슬라이드 생성·메일 발송은 n8n 워크플로우가 담당)
  const brief = (request.brief ?? {}) as MatchingBrief;
  await triggerN8n("rfp.sent", {
    request_id: requestId,
    title: request.title,
    brand_name: brief.brand_name,
    category: brief.category,
    budget_monthly: request.budget_monthly,
    channels: brief.channels,
    partner_count: partners.length,
  });

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  return {
    ok: true,
    message: `RFP를 ${partners.length}개 대행사에 발송 처리했습니다.`,
    count: partners.length,
  };
}

export async function setRequestStatus(
  requestId: string,
  status: RequestStatus,
): Promise<RfpResult> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("matching_requests")
    .update({ status })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  return { ok: true, message: "상태를 변경했습니다.", count: 0 };
}
