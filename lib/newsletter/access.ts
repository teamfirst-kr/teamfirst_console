import "server-only";

import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";

export const NL_COOKIE = "tf_nl"; // 구독자 토큰 (열람 게이트)
export const NL_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const TOKEN_RE = /^[a-f0-9]{48}$/;

export type NewsletterViewer = { id: string; email: string; brand_name: string; status: "subscribed" | "unsubscribed" };

// 열람 권한: 쿠키 토큰 또는 메일 링크의 ?t= 토큰이 실제 구독자와 일치해야 본문을 보여준다.
// (사업자번호·브랜드명·이메일 등록 = 구독 = 열람 권한)
export async function getNewsletterViewer(tokenParam?: string | null): Promise<NewsletterViewer | null> {
  const fromCookie = (await cookies()).get(NL_COOKIE)?.value;
  const candidates = [tokenParam, fromCookie].filter((t): t is string => !!t && TOKEN_RE.test(t));
  if (candidates.length === 0) return null;
  try {
    const admin = createAdminClient();
    for (const t of candidates) {
      const { data } = await admin.from("newsletter_subscribers").select("id, email, brand_name, status").eq("token", t).maybeSingle();
      if (data) return data as NewsletterViewer;
    }
  } catch {
    /* 조회 실패 시 잠금 상태 유지 */
  }
  return null;
}
