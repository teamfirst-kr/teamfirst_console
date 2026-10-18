import "server-only";

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

// 뉴스레터 자동화(Cowork) API 인증 — Authorization: Bearer <NEWSLETTER_API_KEY>
// 키가 설정되지 않으면 API 전체 비활성 (503).
export function checkNewsletterApiKey(request: Request): NextResponse | null {
  const expected = process.env.NEWSLETTER_API_KEY;
  if (!expected) return NextResponse.json({ error: "NEWSLETTER_API_KEY가 설정되지 않아 API가 비활성 상태입니다." }, { status: 503 });
  const auth = request.headers.get("authorization") ?? "";
  const given = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length === 0 || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
