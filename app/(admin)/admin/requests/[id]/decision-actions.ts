"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { partnerWonEmail } from "@/lib/email/templates";
import type { CandidateStatus, RequestStatus } from "@/types/database";

export type DecisionResult = { ok: true; message: string } | { ok: false; error: string };

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") throw new Error("운영자 권한이 필요합니다.");
}

// 대행 성사: 특정 후보를 최종 선정(won), 나머지 후보 lost, 요청 closed_won.
export async function decideWinner(
  requestId: string,
  winnerCandidateId: string,
): Promise<DecisionResult> {
  await assertAdmin();
  const supabase = await createClient();

  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, partner_id")
    .eq("request_id", requestId);
  if (!candidates || candidates.length === 0) {
    return { ok: false, error: "후보가 없습니다." };
  }

  for (const c of candidates) {
    const next: CandidateStatus = c.id === winnerCandidateId ? "won" : "lost";
    await supabase.from("candidates").update({ status: next }).eq("id", c.id);
  }

  await supabase
    .from("matching_requests")
    .update({
      status: "closed_won" satisfies RequestStatus,
      closed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  // 성사 대행사에 안내 메일
  const winner = candidates.find((c) => c.id === winnerCandidateId);
  if (winner) {
    const { data: partner } = await supabase
      .from("partners")
      .select("company_name, contact_email")
      .eq("id", winner.partner_id)
      .single();
    const { data: request } = await supabase
      .from("matching_requests")
      .select("title")
      .eq("id", requestId)
      .single();
    if (partner && request) {
      const mail = partnerWonEmail({
        companyName: partner.company_name,
        requestTitle: request.title,
      });
      await sendEmail({ to: partner.contact_email, ...mail });
    }
  }

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  return { ok: true, message: "대행 성사로 마감했습니다." };
}

// 대행 불발: 모든 후보 lost, 요청 closed_lost.
export async function closeLost(requestId: string): Promise<DecisionResult> {
  await assertAdmin();
  const supabase = await createClient();

  await supabase
    .from("candidates")
    .update({ status: "lost" satisfies CandidateStatus })
    .eq("request_id", requestId);

  await supabase
    .from("matching_requests")
    .update({
      status: "closed_lost" satisfies RequestStatus,
      closed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  return { ok: true, message: "대행 불발로 마감했습니다." };
}
