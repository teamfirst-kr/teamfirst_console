import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPbEmail } from "@/lib/email/pb";
import { notifyAdmins } from "@/lib/email/admin-alert";
import {
  pbConsultingTerminationEmail,
  pbInvoiceRemindEmail,
} from "@/lib/email/templates";
import { periodLastDay, todayKst } from "@/lib/payback-domain";
import { pbMarkOverdueAndNotify } from "@/app/(admin)/admin/payback/settlements/actions";
import type { Json } from "@/types/database";

// ── 00:10 KST 데일리: 1일(옵션 적용) · 11일(overdue 전환) ────────────
export async function runPbMidnightTasks(): Promise<Record<string, unknown>> {
  const today = todayKst();
  const day = Number(today.slice(8, 10));
  const out: Record<string, unknown> = { today };

  // 매월 1일: effective_from 도래 옵션 적용 + 엔타이틀먼트 갱신 + 컨설팅 해제 확정(E8)
  if (day === 1) {
    out.optionApply = await applyDueOptionChanges(today);
  }

  // 매월 11일(정확히는 invoice_due 경과분): pending → overdue + E7
  const dueDay = await getSetting("invoice_due_day", 10);
  if (day === dueDay + 1) {
    out.overdue = await pbMarkOverdueAndNotify();
  }

  return out;
}

// ── 09:00 KST 데일리: 5·9일(E5 리마인드) · 지급일(관리자 요약) ────────
export async function runPbMorningTasks(): Promise<Record<string, unknown>> {
  const today = todayKst();
  const day = Number(today.slice(8, 10));
  const out: Record<string, unknown> = { today };

  if (day === 5 || day === 9) {
    out.remind = await sendInvoiceReminders(today);
  }

  const payoutDay = await getSetting("payout_day", 15);
  if (day === payoutDay) {
    out.payoutSummary = await notifyPayableSummary();
  }

  return out;
}

async function getSetting(key: string, fallback: number): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("pb_app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return Number(data?.value ?? fallback) || fallback;
}

// 옵션 변경 적용 (D4/D3): agreements 반영 + 엔타이틀먼트 + E8 확정
async function applyDueOptionChanges(today: string): Promise<{ applied: number }> {
  const admin = createAdminClient();
  const { data: due } = await admin
    .from("pb_option_changes")
    .select("id, agreement_id, field, new_value, reason, effective_from")
    .lte("effective_from", today)
    .is("applied_at", null)
    .order("effective_from", { ascending: true });

  let applied = 0;
  for (const change of due ?? []) {
    const { data: agreement } = await admin
      .from("pb_agreements")
      .select("id, client_id")
      .eq("id", change.agreement_id)
      .maybeSingle();
    if (!agreement) continue;

    const patch =
      change.field === "all_solutions"
        ? { all_solutions: change.new_value }
        : { consulting: change.new_value };
    await admin.from("pb_agreements").update(patch).eq("id", change.agreement_id);
    await admin
      .from("pb_option_changes")
      .update({ applied_at: new Date().toISOString() })
      .eq("id", change.id);
    applied += 1;

    await admin.from("pb_audit_logs").insert({
      actor_id: null,
      action: "option.applied",
      entity: "pb_agreements",
      entity_id: change.agreement_id,
      diff: {
        field: change.field,
        new_value: change.new_value,
        reason: change.reason,
      } as unknown as Json,
    });

    // 솔루션 전체 옵션 → 엔타이틀먼트 갱신 (4종 or 기본 2종)
    if (change.field === "all_solutions") {
      const { data: solutions } = await admin
        .from("pb_solutions")
        .select("id, sort")
        .order("sort", { ascending: true });
      const all = solutions ?? [];
      const grantIds = new Set(
        (change.new_value ? all : all.slice(0, 2)).map((s) => s.id),
      );
      for (const s of all) {
        await admin.from("pb_entitlements").upsert(
          {
            client_id: agreement.client_id,
            solution_id: s.id,
            active: grantIds.has(s.id),
          },
          { onConflict: "client_id,solution_id" },
        );
      }
    }

    // 컨설팅 자동 해제 확정 → E8 final
    if (change.field === "consulting" && change.reason === "auto_consulting_termination") {
      const { data: client } = await admin
        .from("pb_clients")
        .select("id, company_name, contact_email")
        .eq("id", agreement.client_id)
        .maybeSingle();
      if (client) {
        const mail = pbConsultingTerminationEmail({
          companyName: client.company_name,
          mode: "final",
          effectiveDate: change.effective_from,
        });
        await sendPbEmail({ clientId: client.id, to: client.contact_email, type: "E8", ...mail });
      }
    }
  }
  return { applied };
}

// E5 리마인드 (5·9일, invoice_status = pending)
async function sendInvoiceReminders(today: string): Promise<{ sent: number }> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("pb_monthly_settlements")
    .select("id, client_id, period, payback_supply, invoice_due")
    .eq("invoice_status", "pending");
  let sent = 0;
  for (const s of rows ?? []) {
    if (!s.invoice_due) continue;
    const dday = Math.ceil(
      (new Date(`${s.invoice_due}T00:00:00+09:00`).getTime() -
        new Date(`${today}T00:00:00+09:00`).getTime()) /
        86_400_000,
    );
    if (dday < 0) continue;
    const { data: client } = await admin
      .from("pb_clients")
      .select("company_name, contact_email")
      .eq("id", s.client_id)
      .maybeSingle();
    if (!client) continue;
    const mail = pbInvoiceRemindEmail({
      companyName: client.company_name,
      period: s.period,
      supplyValue: s.payback_supply,
      writeDate: periodLastDay(s.period),
      dueDate: s.invoice_due,
      dday,
    });
    await sendPbEmail({ clientId: s.client_id, to: client.contact_email, type: "E5", ...mail });
    sent += 1;
  }
  return { sent };
}

// 지급일 관리자 요약 (지급은 수동 실행)
async function notifyPayableSummary(): Promise<{ payable: number }> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("pb_monthly_settlements")
    .select("payback_total, invoice_status, reconciled, status")
    .eq("status", "confirmed");
  const payable = (rows ?? []).filter(
    (s) => s.reconciled && ["issued", "not_required"].includes(s.invoice_status),
  );
  const total = payable.reduce((sum, s) => sum + s.payback_total, 0);
  await notifyAdmins({
    type: "pb_payout_day",
    title: "오늘은 페이백 지급일입니다",
    rows: [
      ["지급 가능 건수", `${payable.length}건`],
      ["지급 예정 합계", `${total.toLocaleString()}원 (부가세 포함)`],
      ["대기(미충족) 건수", `${(rows ?? []).length - payable.length}건`],
    ],
    link: "/admin/payback/settlements",
    linkLabel: "지급 처리 화면 열기",
  });
  return { payable: payable.length };
}
