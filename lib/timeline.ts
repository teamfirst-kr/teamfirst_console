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

  // 서로 독립인 조회는 병렬 실행 (후보는 한 번만 조회해 재사용)
  const [{ data: rfps }, { data: apps }, { data: candidates }] =
    await Promise.all([
      supabase
        .from("rfp_notifications")
        .select("sent_at")
        .eq("request_id", requestId),
      supabase
        .from("applications")
        .select("id, partner_id, submitted_at")
        .eq("request_id", requestId)
        .order("submitted_at", { ascending: true }),
      supabase
        .from("candidates")
        .select("id, partner_id, rank, proposed_at, status")
        .eq("request_id", requestId)
        .order("rank", { ascending: true }),
    ]);

  // RFP 발송
  if (request.rfp_sent_at && rfps && rfps.length > 0) {
    events.push({
      at: request.rfp_sent_at,
      icon: "rfp",
      title: "RFP 발송",
      detail: `${rfps.length}개 대행사에 발송`,
    });
  }

  const partnerIds = Array.from(
    new Set([
      ...(apps ?? []).map((a) => a.partner_id),
      ...(candidates ?? []).map((c) => c.partner_id),
    ]),
  );
  const candIdList = (candidates ?? []).map((c) => c.id);
  const candPartner = new Map(
    (candidates ?? []).map((c) => [c.id, c.partner_id]),
  );

  const [{ data: partnersData }, { data: meetings }] = await Promise.all([
    partnerIds.length
      ? supabase.from("partners").select("id, company_name").in("id", partnerIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string }[] }),
    candIdList.length
      ? supabase
          .from("meetings")
          .select("candidate_id, status, scheduled_at, created_at")
          .in("candidate_id", candIdList)
      : Promise.resolve({
          data: [] as {
            candidate_id: string;
            status: string;
            scheduled_at: string | null;
            created_at: string;
          }[],
        }),
  ]);
  const partnerName = new Map(
    (partnersData ?? []).map((p) => [p.id, p.company_name]),
  );

  // 지원서
  for (const a of apps ?? []) {
    events.push({
      at: a.submitted_at,
      icon: "application",
      title: "대행사 지원",
      detail: partnerName.get(a.partner_id) ?? "대행사",
    });
  }

  // 후보 선정
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
