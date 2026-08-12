import { NextResponse } from "next/server";

import { runPbMorningTasks } from "@/lib/payback-cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 매일 09:00 KST — 5·9일: 계산서 리마인드(E5), 지급일: 관리자 요약 알림
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runPbMorningTasks();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron pb-morning]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
