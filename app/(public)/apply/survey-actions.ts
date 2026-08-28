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

// 후속 attach 액션용 (한 응답 흐름에 여러 attach가 있어 한도를 높게)
const attachByIp = new Map<string, number[]>();
async function attachRateLimited(): Promise<boolean> {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const list = (attachByIp.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (list.length >= 30) return true;
  list.push(now);
  attachByIp.set(ip, list);
  return false;
}

// 이탈 설문: 사유 버튼 클릭 즉시 기록 (익명 — RLS는 운영자 조회 전용, 쓰기는 서버 액션만)
// source — 'apply'(정식 신청 페이지) | 'landing'(랜딩 약식 팝업 이탈)
export async function submitApplySurvey(
  reason: string,
  source?: string,
): Promise<SurveyResult> {
  if (!(reason in SURVEY_REASONS)) return { ok: false };
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (surveyRateLimited(ip)) return { ok: false };
  const src = source === "apply" || source === "landing" ? source : null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pb_apply_surveys")
      .insert({ reason, ...(src ? { source: src } : {}) })
      .select("id")
      .single();
    if (error || !data) return { ok: false };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false };
  }
}

// '기타' 선택 시 상세 의견을 기존 응답에 첨부
export async function attachSurveyDetail(
  surveyId: string,
  detail: string,
): Promise<{ ok: boolean }> {
  const cleaned = detail.trim().slice(0, 500);
  if (cleaned.length < 1) return { ok: false };
  if (!/^[0-9a-f-]{36}$/i.test(surveyId)) return { ok: false };
  if (await attachRateLimited()) return { ok: false };
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("pb_apply_surveys")
      .update({ detail: cleaned })
      .eq("id", surveyId)
      .is("detail", null);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

// '이미 받는 페이백' 선택 시: 동일 % 매칭 제안에 대한 예/아니오 기록 (최초 1회)
export async function attachSurveyMatchInterest(
  surveyId: string,
  interest: boolean,
): Promise<{ ok: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(surveyId)) return { ok: false };
  if (await attachRateLimited()) return { ok: false };
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("pb_apply_surveys")
      .update({ match_interest: interest })
      .eq("id", surveyId)
      .is("match_interest", null);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

// 1단계: 현재 받고 있는 페이백 요율만 먼저 기록 (신원 입력 전 이탈해도 남도록)
export async function attachSurveyMatchRate(
  surveyId: string,
  rateInput: string,
): Promise<{ ok: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(surveyId)) return { ok: false };
  if (await attachRateLimited()) return { ok: false };
  const rate = Number(String(rateInput).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(rate) || rate <= 0 || rate > 100) return { ok: false };
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("pb_apply_surveys")
      .update({ match_interest: true, current_rate: rate })
      .eq("id", surveyId)
      .is("current_rate", null); // write-once
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

// 2단계: 브랜드명 + 연락처 (계산기 예산이 있으면 함께 기록) — 검토 후 연락용
export async function attachSurveyMatchForm(
  surveyId: string,
  form: { brand: string; phone: string; budget?: number | null },
): Promise<{ ok: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(surveyId)) return { ok: false };
  if (await attachRateLimited()) return { ok: false };
  const brand = form.brand.trim().slice(0, 100);
  const phone = String(form.phone).replace(/[^\d+-]/g, "").slice(0, 20);
  if (!brand) return { ok: false };
  if (phone.replace(/\D/g, "").length < 9) return { ok: false };
  // 월 예산은 계산기에서 넘어온 참고값 (상한 100억 — 비현실 값·오버플로 방지)
  const budgetNum = Number(form.budget);
  const budget =
    Number.isSafeInteger(budgetNum) && budgetNum > 0 && budgetNum <= 10_000_000_000
      ? budgetNum
      : null;
  try {
    const admin = createAdminClient();
    // write-once: 최초 제출만 기록 (임의 UUID로의 덮어쓰기 방지)
    const { error } = await admin
      .from("pb_apply_surveys")
      .update({
        match_interest: true,
        brand_name: brand,
        phone,
        ...(budget !== null ? { monthly_budget: budget } : {}),
      })
      .eq("id", surveyId)
      .is("brand_name", null);
    return { ok: !error };
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
  if (await attachRateLimited()) return { ok: false };
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
