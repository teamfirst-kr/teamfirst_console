import { NextResponse } from "next/server";

import { runNewsletterScheduledSends } from "@/lib/newsletter/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 뉴스레터 예약 발송 전용 크론 (Pro 플랜 등 크론을 추가할 수 있을 때 vercel.json 에 15분 간격으로 등록).
// 기본 배포에서는 pb-morning(09:00 KST) 크론이 같은 로직을 함께 실행한다.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runNewsletterScheduledSends({ budgetMs: 45_000 });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron newsletter-send]", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
