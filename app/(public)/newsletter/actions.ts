"use server";

import { randomBytes } from "node:crypto";

import { cookies, headers } from "next/headers";

import { NL_COOKIE, NL_COOKIE_MAX_AGE } from "@/lib/newsletter/access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NewsletterOrgType } from "@/types/database";

// 베스트에포트 rate limit (서버리스 인스턴스 단위) — IP당 10분 10회
const recentByIp = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (recentByIp.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (list.length >= 10) return true;
  list.push(now);
  recentByIp.set(ip, list);
  return false;
}

const ORG_TYPES: NewsletterOrgType[] = ["brand", "agency", "marketer", "other"];
// 와일드카드(% * _ 는 LIKE 패턴)·공백·따옴표 등은 거부. 로컬파트는 영숫자와 . _ + - 만 허용
const EMAIL_RE = /^[a-z0-9._+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export type SubscribeResult =
  | { ok: true; already?: boolean; mismatch?: boolean } // mismatch: 기존 등록 이메일이지만 사업자번호가 달라 열람 권한을 주지 않음
  | { ok: false; error: string };

async function setViewerCookie(token: string) {
  (await cookies()).set(NL_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: NL_COOKIE_MAX_AGE,
  });
}

// 뉴스레터 구독/열람 등록 (공개). 사업자번호 + 브랜드명 + 이메일 필수.
// 쓰기는 service_role — 테이블은 운영자만 조회 가능 (pb_leads와 동일 패턴).
// 같은 이메일이 이미 있으면 정보를 갱신하고(수신거부였다면 재구독) 성공으로 처리한다. 성공 시 열람 쿠키를 심는다.
export async function subscribeNewsletter(input: {
  email: string;
  brandName: string;
  bizRegNo: string;
  orgType?: string;
  name?: string;
  source?: string;
  consent: boolean;
}): Promise<SubscribeResult> {
  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 120);
  const brandName = String(input.brandName ?? "").trim().slice(0, 100);
  const bizRegNo = String(input.bizRegNo ?? "").replace(/\D/g, "");
  if (!EMAIL_RE.test(email)) return { ok: false, error: "이메일 주소를 확인해주세요." };
  if (!brandName) return { ok: false, error: "브랜드명을 입력해주세요." };
  if (bizRegNo.length !== 10) return { ok: false, error: "사업자등록번호 10자리를 입력해주세요." };
  if (!input.consent) return { ok: false, error: "뉴스레터 수신에 동의해주세요." };
  const name = String(input.name ?? "").trim().slice(0, 50) || null;
  const orgType: NewsletterOrgType = ORG_TYPES.includes(input.orgType as NewsletterOrgType) ? (input.orgType as NewsletterOrgType) : "brand";
  const source = String(input.source ?? "").trim().slice(0, 60) || null;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return { ok: false, error: "잠시 후 다시 시도해주세요." };

  try {
    const admin = createAdminClient();
    // 정확히 일치하는 이메일만 (ilike는 _ % 가 패턴으로 해석돼 타인 행에 매칭될 수 있음)
    const { data: existing, error: lookupError } = await admin
      .from("newsletter_subscribers")
      .select("id, status, token, biz_reg_no")
      .eq("email", email)
      .maybeSingle();
    if (lookupError) return { ok: false, error: "등록 처리에 실패했습니다. 잠시 후 다시 시도해주세요." };
    const now = new Date().toISOString();
    if (existing) {
      // 기존 등록 이메일: 등록해 둔 사업자번호가 일치해야 본인으로 보고 열람 쿠키를 준다.
      // (이메일만 알면 남의 정보를 덮어쓰거나 수신거부를 되돌리거나 토큰을 받는 것을 막는다)
      if (existing.biz_reg_no !== bizRegNo) return { ok: true, mismatch: true };
      const { error } = await admin
        .from("newsletter_subscribers")
        .update({
          brand_name: brandName,
          ...(name ? { name } : {}),
          org_type: orgType,
          status: "subscribed",
          consented_at: now,
          unsubscribed_at: null,
          updated_at: now,
        })
        .eq("id", existing.id);
      if (error) return { ok: false, error: "등록 처리에 실패했습니다. 잠시 후 다시 시도해주세요." };
      await setViewerCookie(existing.token);
      return { ok: true, already: existing.status === "subscribed" };
    }
    const token = randomBytes(24).toString("hex");
    const { error } = await admin.from("newsletter_subscribers").insert({
      email,
      brand_name: brandName,
      biz_reg_no: bizRegNo,
      name,
      org_type: orgType,
      source,
      status: "subscribed",
      token,
      consented_at: now,
    });
    if (error) return { ok: false, error: "등록 처리에 실패했습니다. 잠시 후 다시 시도해주세요." };
    await setViewerCookie(token);
    return { ok: true };
  } catch {
    return { ok: false, error: "등록 처리에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }
}

// 수신거부·재구독 (메일 하단 링크의 토큰으로만 가능)
export async function setSubscriptionByToken(token: string, status: "subscribed" | "unsubscribed"): Promise<{ ok: boolean; email?: string }> {
  const t = String(token ?? "").trim();
  if (!/^[a-f0-9]{48}$/.test(t)) return { ok: false };
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("newsletter_subscribers")
      .update({ status, unsubscribed_at: status === "unsubscribed" ? now : null, updated_at: now })
      .eq("token", t)
      .select("email")
      .maybeSingle();
    if (error || !data) return { ok: false };
    return { ok: true, email: data.email };
  } catch {
    return { ok: false };
  }
}
