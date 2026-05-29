"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentPartnerId } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { meetingConfirmedEmail } from "@/lib/email/templates";
import { buildIcs } from "@/lib/email/ics";
import type { MatchingBrief } from "@/lib/schemas/matching-request";

export type MeetingRespondResult = { ok: true } | { ok: false; error: string };

function fmtKst(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
}

// 파트너가 제안된 슬롯 중 하나를 수락 → 미팅 확정
export async function acceptMeetingSlot(
  meetingId: string,
  requestId: string,
  slotIso: string,
): Promise<MeetingRespondResult> {
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) return { ok: false, error: "파트너 정보를 찾을 수 없습니다." };

  const supabase = await createClient();

  // 미팅 + 후보 소유 검증
  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, candidate_id, proposed_slots")
    .eq("id", meetingId)
    .maybeSingle();
  if (!meeting) return { ok: false, error: "미팅을 찾을 수 없습니다." };
  if (!(meeting.proposed_slots ?? []).includes(slotIso)) {
    return { ok: false, error: "제안된 일정 중에서 선택해주세요." };
  }

  const { error: mErr } = await supabase
    .from("meetings")
    .update({ scheduled_at: slotIso, status: "confirmed" })
    .eq("id", meetingId);
  if (mErr) return { ok: false, error: mErr.message };

  await supabase
    .from("candidates")
    .update({ status: "meeting_set" })
    .eq("id", meeting.candidate_id);

  // 요청 상태는 service_role로 (파트너는 matching_requests 수정 불가)
  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("candidates")
    .select("request_id, partner_id")
    .eq("id", meeting.candidate_id)
    .single();

  if (candidate) {
    await admin
      .from("matching_requests")
      .update({ status: "meeting_scheduled" })
      .eq("id", candidate.request_id);

    const [{ data: request }, { data: partner }] = await Promise.all([
      admin
        .from("matching_requests")
        .select("title, brief")
        .eq("id", candidate.request_id)
        .single(),
      admin
        .from("partners")
        .select("company_name, contact_email")
        .eq("id", candidate.partner_id)
        .single(),
    ]);

    if (request && partner) {
      const brief = (request.brief ?? {}) as MatchingBrief;
      const ics = buildIcs({
        uid: `${meetingId}@teamfirst`,
        title: `[TeamFirst] ${request.title} 미팅`,
        description: `${brief.brand_name} × ${partner.company_name}`,
        start: new Date(slotIso),
        durationMinutes: 60,
      });
      const attachments = [
        { filename: "meeting.ics", content: Buffer.from(ics).toString("base64") },
      ];

      // 광고주
      if (brief.email) {
        const mail = meetingConfirmedEmail({
          recipientName: brief.brand_name,
          requestTitle: request.title,
          scheduledAt: fmtKst(slotIso),
        });
        await sendEmail({ to: brief.email, ...mail, attachments });
      }
      // 파트너
      const pmail = meetingConfirmedEmail({
        recipientName: partner.company_name,
        requestTitle: request.title,
        scheduledAt: fmtKst(slotIso),
      });
      await sendEmail({ to: partner.contact_email, ...pmail, attachments });
    }
  }

  revalidatePath(`/partner/rfp/${requestId}`);
  return { ok: true };
}

// 파트너가 대안 요청 (재조율)
export async function requestReschedule(
  meetingId: string,
  requestId: string,
): Promise<MeetingRespondResult> {
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) return { ok: false, error: "파트너 정보를 찾을 수 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ status: "rescheduling" })
    .eq("id", meetingId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/partner/rfp/${requestId}`);
  return { ok: true };
}
