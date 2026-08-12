"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPbClientId } from "@/lib/auth";
import { addBusinessDays, todayKst } from "@/lib/payback-domain";
import { notifyAdmins } from "@/lib/email/admin-alert";

export type DisputeResult = { ok: true } | { ok: false; error: string };

// 이의신청 (D12: 확정 후 3영업일 이내)
export async function submitDispute(
  settlementId: string,
  note: string,
): Promise<DisputeResult> {
  const clientId = await getCurrentPbClientId();
  if (!clientId) return { ok: false, error: "권한이 없습니다." };
  if (!note.trim()) return { ok: false, error: "이의신청 사유를 입력해주세요." };

  const supabase = await createClient();
  const { data: s } = await supabase
    .from("pb_monthly_settlements")
    .select("id, client_id, period, statement_no, status, confirmed_at, dispute_flag")
    .eq("id", settlementId)
    .maybeSingle();
  if (!s || s.client_id !== clientId) return { ok: false, error: "정산을 찾을 수 없습니다." };
  if (s.status !== "confirmed") return { ok: false, error: "확정 상태에서만 이의신청할 수 있습니다." };
  if (s.dispute_flag) return { ok: false, error: "이미 이의신청이 접수되었습니다." };
  if (!s.confirmed_at) return { ok: false, error: "확정 정보가 없습니다." };

  const deadline = addBusinessDays(s.confirmed_at.slice(0, 10), 3);
  if (todayKst() > deadline) {
    return { ok: false, error: `이의신청 기간(확정 후 3영업일, ~${deadline})이 지났습니다.` };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("pb_monthly_settlements")
    .update({ dispute_flag: true, dispute_note: note.trim() })
    .eq("id", settlementId);
  if (error) return { ok: false, error: error.message };

  await admin.from("pb_audit_logs").insert({
    actor_id: null,
    action: "settlement.dispute",
    entity: "pb_monthly_settlements",
    entity_id: settlementId,
    diff: { note: note.trim() },
  });

  await notifyAdmins({
    type: "pb_dispute",
    title: "페이백 정산 이의신청",
    rows: [
      ["정산서", s.statement_no ?? s.period],
      ["사유", note.trim().slice(0, 200)],
    ],
    link: "/admin/payback/settlements",
    linkLabel: "정산 확인하기",
  });

  revalidatePath(`/app/settlements/${settlementId}`);
  return { ok: true };
}
