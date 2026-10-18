import { NextResponse } from "next/server";

import { setSubscriptionByToken } from "@/app/(public)/newsletter/actions";

export const dynamic = "force-dynamic";

// RFC 8058 원클릭 수신거부 (List-Unsubscribe-Post). 메일 클라이언트가 POST로 호출한다.
// GET은 상태를 바꾸지 않고 확인 페이지로 보낸다 (링크 스캐너·미리보기가 수신거부를 유발하지 않도록).
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const r = await setSubscriptionByToken(token, "unsubscribed");
  return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 400 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  return NextResponse.redirect(new URL(`/newsletter/unsubscribe?token=${encodeURIComponent(token)}`, url.origin), 303);
}
