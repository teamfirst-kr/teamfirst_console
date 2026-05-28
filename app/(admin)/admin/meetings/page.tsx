import { Calendar } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { DECISION_DEADLINE_DAYS } from "@/lib/schemas/meeting";
import type { MatchingBrief } from "@/lib/schemas/matching-request";

import { MeetingRow, type MeetingRowData } from "./meeting-row";

export const dynamic = "force-dynamic";

export default async function AdminMeetingsPage() {
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, candidate_id, status, scheduled_at, meet_url, created_at")
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  const candidateIds = (meetings ?? []).map((m) => m.candidate_id);
  const { data: candidates } = candidateIds.length
    ? await supabase
        .from("candidates")
        .select("id, request_id, partner_id")
        .in("id", candidateIds)
    : { data: [] as { id: string; request_id: string; partner_id: string }[] };
  const candMap = new Map((candidates ?? []).map((c) => [c.id, c]));

  const requestIds = [...new Set((candidates ?? []).map((c) => c.request_id))];
  const partnerIds = [...new Set((candidates ?? []).map((c) => c.partner_id))];
  const [{ data: requests }, { data: partners }] = await Promise.all([
    requestIds.length
      ? supabase.from("matching_requests").select("id, title, brief").in("id", requestIds)
      : Promise.resolve({ data: [] as { id: string; title: string; brief: unknown }[] }),
    partnerIds.length
      ? supabase.from("partners").select("id, company_name").in("id", partnerIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string }[] }),
  ]);
  const reqMap = new Map((requests ?? []).map((r) => [r.id, r]));
  const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]));

  const now = Date.now();
  const rows: MeetingRowData[] = (meetings ?? []).map((m) => {
    const cand = candMap.get(m.candidate_id);
    const req = cand ? reqMap.get(cand.request_id) : undefined;
    const partner = cand ? partnerMap.get(cand.partner_id) : undefined;
    const brief = (req?.brief ?? {}) as MatchingBrief;

    let deadline: string | null = null;
    let daysLeft: number | null = null;
    if (m.scheduled_at) {
      const d = new Date(m.scheduled_at).getTime() + DECISION_DEADLINE_DAYS * 86400000;
      deadline = new Date(d).toISOString();
      daysLeft = Math.max(0, Math.ceil((d - now) / 86400000));
    }

    return {
      id: m.id,
      requestTitle: req?.title ?? "요청",
      brandName: brief.brand_name ?? "광고주",
      partnerName: partner?.company_name ?? "대행사",
      status: m.status,
      scheduledAt: m.scheduled_at,
      meetUrl: m.meet_url,
      deadline,
      daysLeft,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">미팅</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          확정된 미팅에 구글미트 링크를 등록하고, 대행 결정 데드라인(D-7)을
          관리하세요.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-5 w-5" />}
          title="예정된 미팅이 없습니다"
          description="광고주가 일정을 제안하고 대행사가 수락하면 여기에 표시됩니다."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <MeetingRow key={r.id} data={r} />
          ))}
        </div>
      )}
    </div>
  );
}
