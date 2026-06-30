import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  // 현재 경로를 서버 컴포넌트(가드)에서 읽을 수 있게 헤더로 전달 → 로그인 후 원래 경로로 복귀.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 초기 비밀번호 사용 중인 계정은 비밀번호 변경 화면으로 강제 이동.
  if (user?.app_metadata?.must_change_password) {
    const { pathname } = request.nextUrl;
    const allow =
      pathname.startsWith("/change-password") ||
      pathname.startsWith("/logout") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/auth");
    if (!allow) {
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
