"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import type { SolutionKey } from "@/lib/solution-pricing";
import { subscriptionSchema, type SubscriptionData, type SubscriptionInput } from "./schema";
import type { Json, LeadStatus, SolutionSubscriptionRow, SolutionSubscriptionStatus } from "@/types/database";

export type SolActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function assertAdmin(): Promise<string | null> {
  const role = await getCurrentRole();
  return role === "admin" ? null : "운영자 권한이 필요합니다.";
}

// 상태 전환·수정은 pb_audit_logs에 기록 (페이백 파이프라인과 동일 규칙)
async function audit(action: string, entity: string, entityId: string, diff: Record<string, unknown>) {
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
    console.error("[solutions-audit] 기록 실패:", e);
  }
}

function revalidate() {
  revalidatePath("/admin/solutions");
  revalidatePath("/admin/dashboard");
}

const LEAD_STATUS: LeadStatus[] = ["new", "contacted", "converted", "closed"];
const SUB_STATUS: SolutionSubscriptionStatus[] = ["pending", "active", "paused", "ended"];

// ── 구독 문의 리드 ──────────────────────────────────────────────────
export async function updateLeadStatus(leadId: string, status: LeadStatus, memo: string): Promise<SolActionResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  if (!LEAD_STATUS.includes(status)) return { ok: false, error: "잘못된 상태입니다." };
  try {
    const supabase = await createClient(); // RLS(is_admin) 경유
    const { error } = await supabase
      .from("pb_leads")
      .update({ status, memo: memo.trim().slice(0, 500) || null, handled_at: status === "new" ? null : new Date().toISOString() })
      .eq("id", leadId);
    if (error) return { ok: false, error: error.message };
    await audit("lead_status", "pb_lead", leadId, { status });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "처리에 실패했습니다." };
  }
}

// ── 구독 등록·수정 ──────────────────────────────────────────────────
type Parsed = { ok: true; data: SubscriptionData } | { ok: false; error: string };
function parse(input: unknown): Parsed {
  const r = subscriptionSchema.safeParse(input);
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "입력값을 확인하세요." };
  const d = r.data;
  return { ok: true, data: { ...d, pv: d.solutions.includes("log" as SolutionKey) ? d.pv : null } };
}

export async function createSubscription(input: SubscriptionInput): Promise<SolActionResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  const p = parse(input);
  if (!p.ok) return { ok: false, error: p.error };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("solution_subscriptions").insert(p.data).select("id").single();
    if (error) return { ok: false, error: error.message };
    // 리드에서 전환된 경우 리드 상태를 '구독 전환'으로
    if (p.data.lead_id) {
      await supabase
        .from("pb_leads")
        .update({ status: "converted", handled_at: new Date().toISOString() })
        .eq("id", p.data.lead_id);
    }
    await audit("subscription_create", "solution_subscription", data.id, { status: p.data.status, amount: p.data.amount });
    revalidate();
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "등록에 실패했습니다." };
  }
}

export async function updateSubscription(id: string, input: SubscriptionInput): Promise<SolActionResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  const p = parse(input);
  if (!p.ok) return { ok: false, error: p.error };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("solution_subscriptions")
      .update({ ...p.data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await audit("subscription_update", "solution_subscription", id, { status: p.data.status, amount: p.data.amount });
    revalidate();
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "수정에 실패했습니다." };
  }
}

export async function setSubscriptionStatus(id: string, status: SolutionSubscriptionStatus): Promise<SolActionResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  if (!SUB_STATUS.includes(status)) return { ok: false, error: "잘못된 상태입니다." };
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);
    const patch: Partial<SolutionSubscriptionRow> = { status, updated_at: new Date().toISOString() };
    if (status === "active") patch.ends_at = null;
    if (status === "ended") patch.ends_at = today;
    const { error } = await supabase.from("solution_subscriptions").update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await audit("subscription_status", "solution_subscription", id, { status });
    revalidate();
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "처리에 실패했습니다." };
  }
}
