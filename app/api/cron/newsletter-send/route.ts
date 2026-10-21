import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { bearerFrom, matchesAny } from "@/lib/newsletter/cron-auth";
import { runNewsletterScheduledSends } from "@/lib/newsletter/scheduler";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 뉴스레터 예약 발송 실행 — Supabase pg_cron(037)이 5분마다 호출. (pb-morning 09:00 크론도 같은 로직을 백업으로 실행)
// 인증: Bearer <DB 보관 토큰(app_cron_tokens.newsletter_send)> 또는 Bearer <CRON_SECRET>.
async function dbToken(): Promise<string | null> {
  try {
    const { data } = await createAdminClient().from("app_cron_tokens").select("token").eq("name", "newsletter_send").maybeSingle();
    return data?.token ?? null;
  } catch {
    return null;
  }
}

async function handle(request: Request) {
  const given = bearerFrom(request.headers.get("authorization"));
  const envSecret = process.env.CRON_SECRET;
  const ok = !!given && (matchesAny(given, [envSecret]) || matchesAny(given, [await dbToken()]));
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await runNewsletterScheduledSends({ budgetMs: 45_000 });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron newsletter-send]", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
