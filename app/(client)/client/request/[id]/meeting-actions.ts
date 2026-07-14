"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { meetingProposedEmail } from "@/lib/email/templates";

export type MeetingResult = { ok: true } | { ok: false; error: string };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function fmtSlot(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
}

// 광고주가 후보에게 미팅 일정 후보(최대 3개)를 제안
export async function proposeMeeting(
  candidateId: string,
  requestId: string,
  slots: string[],
): Promise<MeetingResult> {
  const role = await getCurrentRole();
  if (role !== "client") return { ok: false, error: "광고주만 사용할 수 있습니다." };

  // datetime-local 값(YYYY-MM-DDTHH:mm[:ss])에는 타임존이 없어 서버 로컬(UTC 배포 시
  // UTC)로 해석된다. 입력은 항상 한국시간이므로 +09:00을 붙여 KST로 확정 후 저장한다.
  const valid = slots
    .filter(Boolean)
    .map((s) => (s.length === 16 ? `${s}:00` : s))
    .map((s) => new Date(`${s}+09:00`))
    .filter((d) => !Number.isNaN(d.getTime()))
    .map((d) => d.toISOString());
  if (valid.length === 0) {
    return { ok: false, error: "최소 한 개의 일정 후보를 입력해주세요." };
  }
  if (valid.length > 3) {
    return { ok: false, error: "일정 후보는 최대 3개까지 제안할 수 있습니다." };
  }

  const supabase = await createClient();

  // 기존 미팅이 있으면 슬롯 갱신, 없으면 생성 (RLS meet_client)
  const { data: existing } = await supabase
    .from("meetings")
    .select("id")
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("meetings")
      .update({ proposed_slots: valid, status: "pending" })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("meetings").insert({
      candidate_id: candidateId,
      proposed_slots: valid,
      status: "pending",
      duration_minutes: 60,
    });
    if (error) return { ok: false, error: error.message };
  }

  // 파트너 + 요청 정보 조회 후 메일
  const { data: candidate } = await supabase
    .from("candidates")
    .select("partner_id, request_id")
    .eq("id", candidateId)
    .single();
  if (candidate) {
    const [{ data: partner }, { data: request }] = await Promise.all([
      supabase
        .from("partners")
        .select("company_name, contact_email")
        .eq("id", candidate.partner_id)
        .single(),
      supabase
        .from("matching_requests")
        .select("title")
        .eq("id", candidate.request_id)
        .single(),
    ]);
    if (partner && request) {
      const mail = meetingProposedEmail({
        companyName: partner.company_name,
        requestTitle: request.title,
        slots: valid.map(fmtSlot),
        dashboardUrl: `${appUrl()}/partner/rfp/${candidate.request_id}`,
      });
      await sendEmail({ to: partner.contact_email, ...mail });
    }
  }

  revalidatePath(`/client/request/${requestId}`);
  return { ok: true };
}
