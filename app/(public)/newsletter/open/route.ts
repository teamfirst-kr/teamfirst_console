import { NextResponse } from "next/server";

import { getNewsletterViewer, NL_COOKIE, NL_COOKIE_MAX_AGE } from "@/lib/newsletter/access";

export const dynamic = "force-dynamic";

// 메일 링크 진입점: ?t=<토큰>&slug=<호> → 토큰 검증 후 열람 쿠키를 심고 깨끗한 URL로 리다이렉트.
// (토큰이 주소창·분석 도구·전달 메일에 남지 않도록 페이지 URL에는 토큰을 두지 않는다)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const t = url.searchParams.get("t") ?? "";
  const slug = (url.searchParams.get("slug") ?? "").replace(/[^\w가-힣-]/g, "").slice(0, 120);
  const to = url.searchParams.get("to") === "consult" ? "#consult" : "";
  const target = new URL(slug ? `/newsletter/${slug}${to}` : "/newsletter", url.origin);
  const res = NextResponse.redirect(target, 303);
  const viewer = await getNewsletterViewer(t);
  if (viewer) {
    res.cookies.set(NL_COOKIE, t, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: NL_COOKIE_MAX_AGE,
    });
  }
  return res;
}
