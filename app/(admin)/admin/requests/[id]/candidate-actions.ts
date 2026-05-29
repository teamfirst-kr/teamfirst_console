"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import {
  applicationNotShortlistedEmail,
  candidateProposedEmail,
} from "@/lib/email/templates";
import { MAX_CANDIDATES, type CandidateScores } from "@/lib/schemas/candidate";
import type { Json, RequestStatus } from "@/types/database";

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") throw new Error("운영자 권한이 필요합니다.");
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export type SelectResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

// 운영자가 선택한 지원서 id 배열(최대 3, rank 순)을 candidates로 확정.
// 선정되지 않은 지원서는 rejected 처리 + 미선정 통보 메일.
export async function selectCandidates(
  requestId: string,
  selections: { applicationId: string; reason: string; scores: CandidateScores }[],
): Promise<SelectResult> {
  await assertAdmin();

  if (selections.length === 0) {
    return { ok: false, error: "최소 1개 이상의 대행사를 선정해주세요." };
  }
  if (selections.length > MAX_CANDIDATES) {
    return { ok: false, error: `최대 ${MAX_CANDIDATES}개사까지 선정할 수 있습니다.` };
  }

  const supabase = await createClient();

  const { data: request } = await supabase
    .from("matching_requests")
    .select("id, title")
    .eq("id", requestId)
    .single();
  if (!request) return { ok: false, error: "요청을 찾을 수 없습니다." };

  const { data: applications } = await supabase
    .from("applications")
    .select("id, partner_id")
    .eq("request_id", requestId);
  if (!applications) return { ok: false, error: "지원서를 불러오지 못했습니다." };

  const appMap = new Map(applications.map((a) => [a.id, a.partner_id]));
  const selectedIds = new Set(selections.map((s) => s.applicationId));

  // 기존 candidates 제거 후 재생성 (재선정 허용)
  await supabase.from("candidates").delete().eq("request_id", requestId);

  const rows = selections.map((s, i) => ({
    request_id: requestId,
    application_id: s.applicationId,
    partner_id: appMap.get(s.applicationId)!,
    rank: i + 1,
    status: "proposed" as const,
    recommendation_reason: s.reason || null,
    scores: s.scores as unknown as Json,
  }));

  const { error: insertError } = await supabase.from("candidates").insert(rows);
  if (insertError) return { ok: false, error: insertError.message };

  // 지원서 상태 갱신: 선정=shortlisted, 그 외=rejected
  const selectedList = Array.from(selectedIds);
  const rejectedList = applications
    .map((a) => a.id)
    .filter((id) => !selectedIds.has(id));
  await supabase
    .from("applications")
    .update({ status: "shortlisted" })
    .in("id", selectedList);
  if (rejectedList.length > 0) {
    await supabase
      .from("applications")
      .update({ status: "rejected" })
      .in("id", rejectedList);
  }

  // 요청 상태: candidates_sent
  await supabase
    .from("matching_requests")
    .update({ status: "candidates_sent" satisfies RequestStatus })
    .eq("id", requestId);

  // 대행사명 조회 (메일용)
  const partnerIds = applications.map((a) => a.partner_id);
  const { data: partners } = await supabase
    .from("partners")
    .select("id, company_name, contact_email")
    .in("id", partnerIds);
  const partnerMap = new Map(
    (partners ?? []).map((p) => [p.id, p]),
  );

  // 선정 통보 + 미선정 통보 메일
  for (const app of applications) {
    const partner = partnerMap.get(app.partner_id);
    if (!partner) continue;
    if (selectedIds.has(app.id)) {
      const mail = candidateProposedEmail({
        companyName: partner.company_name,
        requestTitle: request.title,
        dashboardUrl: `${appUrl()}/partner/dashboard`,
      });
      await sendEmail({ to: partner.contact_email, ...mail });
    } else {
      const mail = applicationNotShortlistedEmail({
        companyName: partner.company_name,
        requestTitle: request.title,
      });
      await sendEmail({ to: partner.contact_email, ...mail });
    }
  }

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  return {
    ok: true,
    message: `${selections.length}개사를 후보로 확정하고 통보 메일을 발송했습니다.`,
  };
}
