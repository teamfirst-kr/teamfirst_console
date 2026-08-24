"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import {
  calcPayback,
  rateTableFromRow,
  type PaybackPromo,
  type RateTable,
} from "@/lib/payback";
import {
  consultingShouldTerminate,
  effectiveOptionsForPeriod,
  invoiceDueOf,
  isValidPeriod,
  nextPeriod,
  periodLastDay,
  prevPeriod,
  statementNo,
  todayKst,
  type OptionChange,
} from "@/lib/payback-domain";
import { sendPbEmail } from "@/lib/email/pb";
import {
  pbConsultingTerminationEmail,
  pbInvoiceOverdueEmail,
  pbPaidEmail,
  pbStatementEmail,
} from "@/lib/email/templates";
import type { Json, PbSettlementRow } from "@/types/database";

export type PbSettleResult =
  | { ok: true; message?: string; count?: number }
  | { ok: false; error: string };

async function assertAdmin(): Promise<string | null> {
  const role = await getCurrentRole();
  return role === "admin" ? null : "운영자 권한이 필요합니다.";
}

async function audit(
  action: string,
  entity: string,
  entityId: string,
  diff: Record<string, unknown>,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await admin.from("pb_audit_logs").insert({
      actor_id: user?.id ?? null,
      action,
      entity,
      entity_id: entityId,
      diff: diff as unknown as Json,
    });
  } catch (e) {
    console.error("[pb-audit]", e);
  }
}

function revalidate() {
  revalidatePath("/admin/payback/settlements");
}

// 첫 달 프로모션: pb_app_settings.promo_first_month = {"enabled":true,"bonus_rate":1,"free_options":true}
// 해당 고객의 첫 정산(취소 제외, 본 건 제외 기존 정산 0건)에만 적용
async function getFirstMonthPromo(
  clientId: string,
  excludeSettlementId: string,
): Promise<PaybackPromo | null> {
  const admin = createAdminClient();
  const { data: setting } = await admin
    .from("pb_app_settings")
    .select("value")
    .eq("key", "promo_first_month")
    .maybeSingle();
  const cfg = (setting?.value ?? null) as {
    enabled?: boolean;
    bonus_rate?: number;
    free_options?: boolean;
  } | null;
  if (!cfg?.enabled) return null;

  const { count } = await admin
    .from("pb_monthly_settlements")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .neq("status", "canceled")
    .neq("id", excludeSettlementId);
  if ((count ?? 0) > 0) return null;

  return {
    bonusRate: Number(cfg.bonus_rate ?? 1) || 0,
    freeOptions: cfg.free_options !== false,
  };
}

async function getInvoiceDueDay(): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("pb_app_settings")
    .select("value")
    .eq("key", "invoice_due_day")
    .maybeSingle();
  return Number(data?.value ?? 10) || 10;
}

// 해당 정산월의 유효 옵션 + 약정 요율표 로드
async function loadCalcContext(
  agreementId: string,
  period: string,
): Promise<
  | {
      table: RateTable;
      options: { all_solutions: boolean; consulting: boolean };
    }
  | { error: string }
> {
  const admin = createAdminClient();
  const { data: agreement } = await admin
    .from("pb_agreements")
    .select("id, rate_table_id, all_solutions, consulting")
    .eq("id", agreementId)
    .maybeSingle();
  if (!agreement) return { error: "약정을 찾을 수 없습니다." };

  const [{ data: rt }, { data: changes }] = await Promise.all([
    admin
      .from("pb_rate_tables")
      .select("version, tiers, modifiers, consulting_min_spend")
      .eq("id", agreement.rate_table_id)
      .maybeSingle(),
    admin
      .from("pb_option_changes")
      .select("field, new_value, effective_from")
      .eq("agreement_id", agreementId),
  ]);
  if (!rt) return { error: "약정 요율표를 찾을 수 없습니다." };

  const options = effectiveOptionsForPeriod(
    { all_solutions: agreement.all_solutions, consulting: agreement.consulting },
    (changes ?? []) as OptionChange[],
    period,
  );
  return { table: rateTableFromRow(rt), options };
}

// 1. 기간 선택 → active 고객 전원 draft 생성
export async function pbGenerateDrafts(period: string): Promise<PbSettleResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  if (!isValidPeriod(period)) return { ok: false, error: "기간 형식이 올바르지 않습니다." };

  const admin = createAdminClient();
  const [{ data: actives }, { data: existing }] = await Promise.all([
    admin.from("pb_clients").select("id").eq("status", "active"),
    admin
      .from("pb_monthly_settlements")
      .select("client_id")
      .eq("period", period)
      .neq("status", "canceled"),
  ]);
  const existingSet = new Set((existing ?? []).map((r) => r.client_id));
  const targets = (actives ?? []).filter((c) => !existingSet.has(c.id));
  if (targets.length === 0) {
    return { ok: true, message: "생성할 대상이 없습니다. (이미 전원 생성됨)", count: 0 };
  }

  // 각 고객의 활성 약정
  const { data: agreements } = await admin
    .from("pb_agreements")
    .select("id, client_id")
    .eq("status", "active")
    .in("client_id", targets.map((t) => t.id));
  const agreementByClient = new Map((agreements ?? []).map((a) => [a.client_id, a.id]));

  const rows = targets
    .filter((t) => agreementByClient.has(t.id))
    .map((t) => ({
      client_id: t.id,
      agreement_id: agreementByClient.get(t.id)!,
      period,
      status: "draft" as const,
    }));
  if (rows.length === 0) return { ok: false, error: "활성 약정이 있는 고객이 없습니다." };

  const { error } = await admin.from("pb_monthly_settlements").insert(rows);
  if (error) return { ok: false, error: error.message };
  await audit("settlement.generate", "pb_monthly_settlements", rows[0].client_id, {
    period,
    count: rows.length,
  });
  revalidate();
  return { ok: true, message: `${rows.length}건 draft 생성`, count: rows.length };
}

// 2. 광고비 입력 (draft만) — 입력 즉시 미리보기 재계산해 저장
export async function pbUpdateSpend(
  settlementId: string,
  adSpendTotal: number,
  spendDetails?: { media: string; product: string; amount: number }[],
): Promise<PbSettleResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  if (!Number.isInteger(adSpendTotal) || adSpendTotal < 0) {
    return { ok: false, error: "광고비는 0 이상의 정수(원)여야 합니다." };
  }

  const admin = createAdminClient();
  const { data: s } = await admin
    .from("pb_monthly_settlements")
    .select("id, status, agreement_id, period, client_id")
    .eq("id", settlementId)
    .maybeSingle();
  if (!s) return { ok: false, error: "정산을 찾을 수 없습니다." };
  if (s.status !== "draft") {
    return { ok: false, error: "draft 상태에서만 광고비를 수정할 수 있습니다." };
  }

  const ctx = await loadCalcContext(s.agreement_id, s.period);
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const { data: client } = await admin
    .from("pb_clients")
    .select("invoice_capable")
    .eq("id", s.client_id)
    .maybeSingle();

  const promo = await getFirstMonthPromo(s.client_id, s.id);
  const result = calcPayback(
    ctx.table,
    {
      adSpend: adSpendTotal,
      allSolutions: ctx.options.all_solutions,
      consulting: ctx.options.consulting,
      invoiceCapable: client?.invoice_capable ?? true,
    },
    promo ?? undefined,
  );

  const { error } = await admin
    .from("pb_monthly_settlements")
    .update({
      ad_spend_total: adSpendTotal,
      spend_details: (spendDetails ?? []) as unknown as Json,
      rate_table_version: ctx.table.version,
      tier_label: result.tierLabel,
      base_rate: result.baseRate,
      // 음수 = 프로모션 가산 (applied = base − modifier_total 관계 유지)
      modifier_total: result.modifierTotal - result.promoBonus,
      applied_rate: result.appliedRate,
      payback_supply: result.supplyValue,
      payback_vat: result.vat,
      payback_total: result.totalPayout,
    })
    .eq("id", settlementId);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// CSV 일괄 반영: [{business_number, media, product, amount}] → 사업자번호별 집계
export async function pbImportSpendRows(
  period: string,
  rows: { business_number: string; media: string; product: string; amount: number }[],
): Promise<PbSettleResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };

  const admin = createAdminClient();
  const byBizno = new Map<string, { media: string; product: string; amount: number }[]>();
  for (const r of rows) {
    const bn = r.business_number.replace(/\D/g, "");
    if (bn.length !== 10 || !Number.isFinite(r.amount)) continue;
    const list = byBizno.get(bn) ?? [];
    list.push({ media: r.media, product: r.product, amount: Math.floor(r.amount) });
    byBizno.set(bn, list);
  }
  if (byBizno.size === 0) return { ok: false, error: "유효한 행이 없습니다." };

  const { data: clients } = await admin
    .from("pb_clients")
    .select("id, business_number")
    .in("business_number", Array.from(byBizno.keys()));
  const clientByBizno = new Map((clients ?? []).map((c) => [c.business_number, c.id]));

  const { data: drafts } = await admin
    .from("pb_monthly_settlements")
    .select("id, client_id")
    .eq("period", period)
    .eq("status", "draft");
  const draftByClient = new Map((drafts ?? []).map((d) => [d.client_id, d.id]));

  let applied = 0;
  let unmatched = 0;
  for (const [bizno, details] of byBizno) {
    const clientId = clientByBizno.get(bizno);
    const draftId = clientId ? draftByClient.get(clientId) : undefined;
    if (!draftId) {
      unmatched += 1;
      continue;
    }
    const total = details.reduce((sum, d) => sum + d.amount, 0);
    const res = await pbUpdateSpend(draftId, total, details);
    if (res.ok) applied += 1;
  }
  revalidate();
  return {
    ok: true,
    message: `${applied}건 반영${unmatched ? `, ${unmatched}건 매칭 실패(사업자번호/draft 없음)` : ""}`,
    count: applied,
  };
}

// 4. 일괄 확정: 채번 + 스냅샷 고정 + E4 발송 + invoice_due + 컨설팅 미달 감지
export async function pbBulkConfirm(period: string): Promise<PbSettleResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };

  const admin = createAdminClient();
  const { data: drafts } = await admin
    .from("pb_monthly_settlements")
    .select("*")
    .eq("period", period)
    .eq("status", "draft")
    .order("created_at", { ascending: true });
  const targets = ((drafts ?? []) as PbSettlementRow[]).filter(
    (d) => d.ad_spend_total > 0,
  );
  if (targets.length === 0) {
    return { ok: false, error: "확정할 draft가 없습니다. (광고비 입력 필요)" };
  }

  const dueDay = await getInvoiceDueDay();
  const invoiceDue = invoiceDueOf(period, dueDay);
  const writeDate = periodLastDay(period);

  // 채번 시작 seq: 이 기간의 기존 statement_no 개수 이후부터
  const { count: existingCount } = await admin
    .from("pb_monthly_settlements")
    .select("id", { count: "exact", head: true })
    .eq("period", period)
    .not("statement_no", "is", null);
  let seq = (existingCount ?? 0) + 1;

  const { data: clients } = await admin
    .from("pb_clients")
    .select("id, company_name, contact_email, invoice_capable")
    .in("id", targets.map((t) => t.client_id));
  const clientById = new Map((clients ?? []).map((c) => [c.id, c]));

  let confirmed = 0;
  for (const s of targets) {
    const client = clientById.get(s.client_id);
    if (!client) continue;
    const no = statementNo(period, seq);
    const { error } = await admin
      .from("pb_monthly_settlements")
      .update({
        statement_no: no,
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        invoice_status: client.invoice_capable ? "pending" : "not_required",
        invoice_due: client.invoice_capable ? invoiceDue : null,
      })
      .eq("id", s.id)
      .eq("status", "draft");
    if (error) {
      console.error("[pb-confirm]", s.id, error.message);
      continue;
    }
    seq += 1;
    confirmed += 1;
    await audit("settlement.confirm", "pb_monthly_settlements", s.id, {
      statement_no: no,
      period,
      payback_total: s.payback_total,
    });

    // E4 정산서 메일
    const mail = pbStatementEmail({
      companyName: client.company_name,
      period,
      statementNo: no,
      adSpend: s.ad_spend_total,
      appliedRate: Number(s.applied_rate ?? 0),
      supplyValue: s.payback_supply,
      vat: s.payback_vat,
      total: s.payback_total,
      invoiceCapable: client.invoice_capable,
      writeDate,
      dueDate: invoiceDue,
    });
    await sendPbEmail({
      clientId: s.client_id,
      to: client.contact_email,
      type: "E4",
      ...mail,
      payload: { settlement_id: s.id, statement_no: no } as unknown as Json,
    });

    // 컨설팅 2개월 연속 미달 감지 (D3) → 익월 1일 자동 해제 예약 + E8 예고
    await maybeScheduleConsultingTermination(s.agreement_id, s.client_id, period);
  }

  revalidate();
  return { ok: true, message: `${confirmed}건 확정·정산서 발송 완료`, count: confirmed };
}

async function maybeScheduleConsultingTermination(
  agreementId: string,
  clientId: string,
  period: string,
): Promise<void> {
  const admin = createAdminClient();
  const ctx = await loadCalcContext(agreementId, period);
  if ("error" in ctx || !ctx.options.consulting) return;

  // 이번 달 포함 최근 2개 확정 정산의 광고비
  const { data: recent } = await admin
    .from("pb_monthly_settlements")
    .select("period, ad_spend_total")
    .eq("agreement_id", agreementId)
    .in("period", [period, prevPeriod(period)])
    .neq("status", "canceled")
    .order("period", { ascending: false });
  const spends = (recent ?? []).map((r) => r.ad_spend_total);
  if (!consultingShouldTerminate(spends, ctx.table.consultingMinSpend)) return;

  const effectiveFrom = `${nextPeriod(period)}-01`;
  // 이미 같은 예약이 있으면 skip
  const { data: dup } = await admin
    .from("pb_option_changes")
    .select("id")
    .eq("agreement_id", agreementId)
    .eq("field", "consulting")
    .eq("reason", "auto_consulting_termination")
    .is("applied_at", null)
    .limit(1);
  if (dup && dup.length > 0) return;

  await admin.from("pb_option_changes").insert({
    agreement_id: agreementId,
    field: "consulting",
    old_value: true,
    new_value: false,
    effective_from: effectiveFrom,
    reason: "auto_consulting_termination",
  });
  await audit("option.auto_terminate_scheduled", "pb_agreements", agreementId, {
    effective_from: effectiveFrom,
    period,
  });

  const { data: client } = await admin
    .from("pb_clients")
    .select("company_name, contact_email")
    .eq("id", clientId)
    .maybeSingle();
  if (client) {
    const mail = pbConsultingTerminationEmail({
      companyName: client.company_name,
      mode: "notice",
      effectiveDate: effectiveFrom,
    });
    await sendPbEmail({ clientId, to: client.contact_email, type: "E8", ...mail });
  }
}

// 5-a. 계산서 발행 확인 (pending/overdue → issued)
export async function pbSetInvoiceIssued(
  settlementId: string,
  issuedDate: string,
): Promise<PbSettleResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("pb_monthly_settlements")
    .update({ invoice_status: "issued", invoice_issued_at: issuedDate })
    .eq("id", settlementId)
    .in("invoice_status", ["pending", "overdue"])
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!rows || rows.length === 0) {
    return { ok: false, error: "발행 확인 가능한 상태가 아닙니다." };
  }
  await audit("settlement.invoice_issued", "pb_monthly_settlements", settlementId, {
    issued_at: issuedDate,
  });
  revalidate();
  return { ok: true };
}

// 5-b. 매체 수수료 입금 대사 체크
export async function pbSetReconciled(
  settlementId: string,
  value: boolean,
): Promise<PbSettleResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  const admin = createAdminClient();
  const { error } = await admin
    .from("pb_monthly_settlements")
    .update({
      reconciled: value,
      reconciled_at: value ? new Date().toISOString() : null,
    })
    .eq("id", settlementId)
    .in("status", ["confirmed"]);
  if (error) return { ok: false, error: error.message };
  await audit("settlement.reconciled", "pb_monthly_settlements", settlementId, {
    reconciled: value,
  });
  revalidate();
  return { ok: true };
}

// 6. 개별 취소 (사유 필수, D11 — 수정은 취소+재생성만)
export async function pbCancelSettlement(
  settlementId: string,
  reason: string,
): Promise<PbSettleResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  if (!reason.trim()) return { ok: false, error: "취소 사유를 입력해주세요." };
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("pb_monthly_settlements")
    .update({ status: "canceled", cancel_reason: reason.trim() })
    .eq("id", settlementId)
    .in("status", ["draft", "confirmed"])
    .select("id, period, client_id");
  if (error) return { ok: false, error: error.message };
  if (!rows || rows.length === 0) {
    return { ok: false, error: "취소 가능한 상태가 아닙니다. (지급 완료 건은 취소 불가)" };
  }
  await audit("settlement.cancel", "pb_monthly_settlements", settlementId, { reason });
  revalidate();
  return { ok: true, message: "취소되었습니다. 필요 시 draft를 다시 생성하세요." };
}

// payable 판정 (§4.2 파생 상태)
export async function pbPayableOf(s: {
  status: string;
  reconciled: boolean;
  invoice_status: string;
}): Promise<boolean> {
  return (
    s.status === "confirmed" &&
    s.reconciled &&
    ["issued", "not_required"].includes(s.invoice_status)
  );
}

// 7. 지급 처리: 선택 건 → payout 배치 → paid + E6
export async function pbCreatePayout(
  settlementIds: string[],
  memo: string,
): Promise<PbSettleResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  if (settlementIds.length === 0) return { ok: false, error: "선택된 건이 없습니다." };

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("pb_monthly_settlements")
    .select("*")
    .in("id", settlementIds);
  const settlements = (rows ?? []) as PbSettlementRow[];

  const payable = settlements.filter(
    (s) =>
      s.status === "confirmed" &&
      s.reconciled &&
      ["issued", "not_required"].includes(s.invoice_status),
  );
  if (payable.length === 0) {
    return { ok: false, error: "지급 가능한(payable) 건이 없습니다. 계산서·대사 상태를 확인하세요." };
  }

  // 최소 지급액 (§12): 고객별 합산이 min_payout 미만이면 이번 배치에서 제외(이월)
  const { data: minRow } = await admin
    .from("pb_app_settings")
    .select("value")
    .eq("key", "min_payout")
    .maybeSingle();
  const minPayout = Number(minRow?.value ?? 10000) || 0;

  const byClient = new Map<string, PbSettlementRow[]>();
  for (const s of payable) {
    const list = byClient.get(s.client_id) ?? [];
    list.push(s);
    byClient.set(s.client_id, list);
  }
  const paidClients: { clientId: string; items: PbSettlementRow[] }[] = [];
  let deferred = 0;
  for (const [clientId, items] of byClient) {
    const total = items.reduce((sum, s) => sum + s.payback_total, 0);
    if (total < minPayout) {
      deferred += items.length;
      continue;
    }
    paidClients.push({ clientId, items });
  }
  if (paidClients.length === 0) {
    return { ok: false, error: `전 건이 최소 지급액(${minPayout.toLocaleString()}원) 미만으로 이월됩니다.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const grandTotal = paidClients
    .flatMap((p) => p.items)
    .reduce((sum, s) => sum + s.payback_total, 0);
  const { data: payout, error: payoutError } = await admin
    .from("pb_payouts")
    .insert({
      paid_at: todayKst(),
      total_amount: grandTotal,
      memo: memo || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (payoutError || !payout) {
    return { ok: false, error: payoutError?.message ?? "지급 배치 생성 실패" };
  }

  const now = new Date().toISOString();
  let paidCount = 0;
  for (const { clientId, items } of paidClients) {
    for (const s of items) {
      const { error } = await admin
        .from("pb_monthly_settlements")
        .update({ status: "paid", paid_at: now, payout_id: payout.id })
        .eq("id", s.id)
        .eq("status", "confirmed");
      if (!error) {
        paidCount += 1;
        await audit("settlement.paid", "pb_monthly_settlements", s.id, {
          payout_id: payout.id,
        });
      }
    }

    // E6 지급 완료 (고객별 합산 1통)
    const { data: client } = await admin
      .from("pb_clients")
      .select("company_name, contact_email, bank_account")
      .eq("id", clientId)
      .maybeSingle();
    if (client) {
      const supply = items.reduce((sum, s) => sum + s.payback_supply, 0);
      const vat = items.reduce((sum, s) => sum + s.payback_vat, 0);
      const mail = pbPaidEmail({
        companyName: client.company_name,
        periods: items.map((s) => s.period),
        supplyValue: supply,
        vat,
        total: supply + vat,
        bankLast4: (client.bank_account ?? "").slice(-4) || "미등록",
      });
      await sendPbEmail({
        clientId,
        to: client.contact_email,
        type: "E6",
        ...mail,
        payload: { payout_id: payout.id } as unknown as Json,
      });
    }
  }

  revalidate();
  return {
    ok: true,
    message: `${paidCount}건 지급 처리 (배치 합계 ${grandTotal.toLocaleString()}원)${deferred ? ` · ${deferred}건 최소지급액 미만 이월` : ""}`,
    count: paidCount,
  };
}

// 크론용: invoice_due 경과 pending → overdue + E7 (매월 11일)
export async function pbMarkOverdueAndNotify(): Promise<{ moved: number }> {
  const admin = createAdminClient();
  const today = todayKst();
  const { data: rows } = await admin
    .from("pb_monthly_settlements")
    .select("id, client_id, period, payback_supply, invoice_due")
    .eq("invoice_status", "pending")
    .lt("invoice_due", today);
  let moved = 0;
  for (const s of rows ?? []) {
    const { error } = await admin
      .from("pb_monthly_settlements")
      .update({ invoice_status: "overdue" })
      .eq("id", s.id)
      .eq("invoice_status", "pending");
    if (error) continue;
    moved += 1;
    await audit("settlement.overdue", "pb_monthly_settlements", s.id, {
      invoice_due: s.invoice_due,
    });
    const { data: client } = await admin
      .from("pb_clients")
      .select("company_name, contact_email")
      .eq("id", s.client_id)
      .maybeSingle();
    if (client) {
      const mail = pbInvoiceOverdueEmail({
        companyName: client.company_name,
        period: s.period,
        supplyValue: s.payback_supply,
        writeDate: periodLastDay(s.period),
        dueDate: s.invoice_due ?? "",
      });
      await sendPbEmail({
        clientId: s.client_id,
        to: client.contact_email,
        type: "E7",
        ...mail,
      });
    }
  }
  return { moved };
}
