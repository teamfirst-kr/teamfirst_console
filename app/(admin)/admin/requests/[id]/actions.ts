"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { rfpArrivedEmail } from "@/lib/email/templates";
import type { MatchingBrief } from "@/lib/schemas/matching-request";
import type { RequestStatus } from "@/types/database";

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
    .select("id, company_name, contact_email")
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
      rfpUrl,
    });
    const r = await sendEmail({ to: p.contact_email, ...mail });
    if (r.ok) mailed++;
  }
  if (mailed > 0) {
    await supabase
      .from("rfp_notifications")
      .update({ email_sent: true })
      .eq("request_id", requestId);
  }

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
  const { error } = await supabase
    .from("matching_requests")
    .update({ status })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  return { ok: true, message: "상태를 변경했습니다.", count: 0 };
}
