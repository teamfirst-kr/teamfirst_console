import { createClient } from "@/lib/supabase/server";
import type { MatchingBrief } from "@/lib/schemas/matching-request";

export type TimelineEvent = {
  at: string; // ISO
  icon: "submit" | "rfp" | "application" | "candidate" | "meeting" | "decision";
  title: string;
  detail?: string;
};

// 한 매칭 요청의 전 과정을 시간순 이벤트로 조립한다.
// 메일함을 뒤지지 않고 한 화면에서 이력을 추적하기 위한 핵심 기능.
export async function buildRequestTimeline(
  requestId: string,
): Promise<TimelineEvent[]> {
  const supabase = await createClient();
  const events: TimelineEvent[] = [];

  const { data: request } = await supabase
    .from("matching_requests")
    .select("title, brief, submitted_at, rfp_sent_at, created_at, status")
    .eq("id", requestId)
    .single();
  if (!request) return [];

  const brief = (request.brief ?? {}) as MatchingBrief;

  events.push({
    at: request.submitted_at ?? request.created_at,
    icon: "submit",
    title: "매칭 요청 제출",
    detail: brief.brand_name ?? request.title,
  });

  // RFP 발송
  const { data: rfps } = await supabase
    .from("rfp_notifications")
    .select("sent_at")
    .eq("request_id", requestId);
  if (request.rfp_sent_at && rfps && rfps.length > 0) {
    events.push({
      at: request.rfp_sent_at,
      icon: "rfp",
      title: "RFP 발송",
      detail: `${rfps.length}개 대행사에 발송`,
    });
  }

  // 지원서
  const { data: apps } = await supabase
    .from("applications")
    .select("id, partner_id, submitted_at")
    .eq("request_id", requestId)
    .order("submitted_at", { ascending: true });

  const appPartnerIds = (apps ?? []).map((a) => a.partner_id);
  const { data: partnersData } = appPartnerIds.length
    ? await supabase
        .from("partners")
        .select("id, company_name")
        .in("id", appPartnerIds)
    : { data: [] as { id: string; company_name: string }[] };
  const partnerName = new Map((partnersData ?? []).map((p) => [p.id, p.company_name]));

  for (const a of apps ?? []) {
    events.push({
      at: a.submitted_at,
      icon: "application",
      title: "대행사 지원",
      detail: partnerName.get(a.partner_id) ?? "대행사",
    });
  }

  // 후보 선정
  const { data: candidates } = await supabase
    .from("candidates")
    .select("partner_id, rank, proposed_at, status")
    .eq("request_id", requestId)
    .order("rank", { ascending: true });

  if (candidates && candidates.length > 0) {
    events.push({
      at: candidates[0].proposed_at,
      icon: "candidate",
      title: "상위 후보 선정",
      detail: `${candidates.length}개사 — ${candidates
        .map((c) => partnerName.get(c.partner_id) ?? "대행사")
        .join(", ")}`,
    });
  }

  // 미팅
  const { data: candRows } = await supabase
    .from("candidates")
    .select("id, partner_id")
    .eq("request_id", requestId);
  const candIdList = (candRows ?? []).map((c) => c.id);
  const candPartner = new Map((candRows ?? []).map((c) => [c.id, c.partner_id]));

  const { data: meetings } = candIdList.length
    ? await supabase
        .from("meetings")
        .select("candidate_id, status, scheduled_at, created_at")
        .in("candidate_id", candIdList)
    : { data: [] as { candidate_id: string; status: string; scheduled_at: string | null; created_at: string }[] };

  for (const m of meetings ?? []) {
    const pName = partnerName.get(candPartner.get(m.candidate_id) ?? "") ?? "대행사";
    if (m.status === "confirmed" && m.scheduled_at) {
      events.push({
        at: m.scheduled_at,
        icon: "meeting",
        title: "미팅 확정",
        detail: pName,
      });
    } else {
      events.push({
        at: m.created_at,
        icon: "meeting",
        title: "미팅 일정 조율 중",
        detail: pName,
      });
    }
  }

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return events;
}
