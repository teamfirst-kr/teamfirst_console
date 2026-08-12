import { NextResponse } from "next/server";

import { runPbMidnightTasks } from "@/lib/payback-cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 매일 00:10 KST — 1일: 옵션 적용/컨설팅 해제 확정, 11일: 계산서 overdue 전환(E7)
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runPbMidnightTasks();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron pb-midnight]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
