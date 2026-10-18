import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // 뉴스레터 메일 링크(/newsletter/<slug>?t=토큰)는 렌더 전에 토큰 교환 라우트로 보낸다
  // (페이지 단계 redirect는 스트리밍 뒤라 meta refresh로 내려가 토큰이 HTML·주소창에 남음)
  const { pathname, searchParams } = request.nextUrl;
  if (pathname.startsWith("/newsletter/") && pathname !== "/newsletter/open" && searchParams.has("t")) {
    const slug = pathname.slice("/newsletter/".length).split("/")[0];
    const url = request.nextUrl.clone();
    url.pathname = "/newsletter/open";
    url.search = "";
    url.searchParams.set("t", searchParams.get("t") ?? "");
    url.searchParams.set("slug", slug);
    return NextResponse.redirect(url, 307);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
