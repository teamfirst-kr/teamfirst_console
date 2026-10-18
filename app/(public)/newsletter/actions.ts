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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type SubscribeResult = { ok: true; already?: boolean } | { ok: false; error: string };

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
    const { data: existing } = await admin.from("newsletter_subscribers").select("id, status, token").ilike("email", email).maybeSingle();
    const now = new Date().toISOString();
    if (existing) {
      const { error } = await admin
        .from("newsletter_subscribers")
        .update({
          brand_name: brandName,
          biz_reg_no: bizRegNo,
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
