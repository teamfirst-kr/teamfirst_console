"use server";

import { getCurrentRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PII_ENTITIES, PII_FIELDS, PII_VIEW_ACTION, type PiiEntity, type PiiField } from "@/lib/pii";
import type { Json } from "@/types/database";

export type RevealResult = { ok: true; value: string } | { ok: false; error: string };

// 엔터티별로 열람 가능한 필드 (그 외 조합은 거부)
const ALLOWED: Record<PiiEntity, readonly PiiField[]> = {
  pb_leads: ["phone", "email", "message"],
  solution_subscriptions: ["phone", "email", "member_emails"],
  pb_apply_surveys: ["phone"],
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 열람 기록 — 운영자 세션(RLS)으로 pb_audit_logs에 남긴다. 실패하면 원문을 돌려주지 않는다(fail-closed).
export async function logPiiView(entity: PiiEntity, entityId: string, field: PiiField | "all"): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from("pb_audit_logs").insert({
      actor_id: user.id,
      action: PII_VIEW_ACTION,
      entity,
      entity_id: entityId,
      diff: { field } as unknown as Json,
    });
    return !error;
  } catch {
    return false;
  }
}

// 운영자 "보기" — 권한 확인 → 열람 기록 → 원문 반환 (D-093 3중 보안 — 3단계)
export async function revealPii(entity: PiiEntity, entityId: string, field: PiiField): Promise<RevealResult> {
  if (!(PII_ENTITIES as readonly string[]).includes(entity) || !(PII_FIELDS as readonly string[]).includes(field)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }
  if (!ALLOWED[entity].includes(field) || !UUID_RE.test(entityId)) return { ok: false, error: "잘못된 요청입니다." };
  if ((await getCurrentRole()) !== "admin") return { ok: false, error: "운영자 권한이 필요합니다." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(entity).select(field).eq("id", entityId).maybeSingle();
    if (error || !data) return { ok: false, error: "정보를 찾을 수 없습니다." };
    if (!(await logPiiView(entity, entityId, field))) return { ok: false, error: "열람 기록을 남기지 못해 표시하지 않습니다. 잠시 후 다시 시도해주세요." };
    const raw = (data as Record<string, unknown>)[field];
    const value = Array.isArray(raw) ? raw.map(String).join(", ") : raw == null ? "" : String(raw);
    return { ok: true, value };
  } catch {
    return { ok: false, error: "정보를 불러오지 못했습니다." };
  }
}
