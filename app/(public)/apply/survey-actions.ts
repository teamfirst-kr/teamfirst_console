"use server";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { SURVEY_REASONS } from "@/lib/apply-survey";

type SurveyResult = { ok: true; id: string } | { ok: false };

// 베스트에포트 rate limit (서버리스 인스턴스 단위)
const recentByIp = new Map<string, number[]>();
function surveyRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (recentByIp.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (list.length >= 10) return true;
  list.push(now);
  recentByIp.set(ip, list);
  return false;
}

// 이탈 설문: 사유 버튼 클릭 즉시 기록 (익명 — RLS는 운영자 조회 전용, 쓰기는 서버 액션만)
export async function submitApplySurvey(reason: string): Promise<SurveyResult> {
  if (!(reason in SURVEY_REASONS)) return { ok: false };
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (surveyRateLimited(ip)) return { ok: false };
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pb_apply_surveys")
      .insert({ reason })
      .select("id")
      .single();
    if (error || !data) return { ok: false };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false };
  }
}

// 후속 문항: 1:1 전화상담 희망 연락처를 기존 응답에 첨부
export async function attachSurveyPhone(
  surveyId: string,
  phone: string,
): Promise<{ ok: boolean }> {
  const cleaned = phone.replace(/[^\d+-]/g, "").slice(0, 20);
  if (cleaned.replace(/\D/g, "").length < 9) return { ok: false };
  if (!/^[0-9a-f-]{36}$/i.test(surveyId)) return { ok: false };
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("pb_apply_surveys")
      .update({ phone: cleaned })
      .eq("id", surveyId)
      .is("phone", null);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
