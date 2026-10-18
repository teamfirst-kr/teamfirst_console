import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { APP_CATEGORIES, APP_STATUS_LABEL, appLabel, categoryLabel, type MarketApp } from "@/lib/solution-market";
import { getMarketApps } from "@/lib/solution-market-server";

export const dynamic = "force-dynamic";

const STATUS_VARIANT = { available: "success", coming_soon: "warning", hidden: "muted" } as const;

// 솔루션 마켓 앱 카탈로그 — 운영자가 사내 솔루션을 마켓 앱으로 등록·노출 관리.
export default async function MarketAppsPage() {
  const { apps, fallback } = await getMarketApps();

  // 앱별 구독 사용 수 (숨김 처리 판단용)
  const usage = new Map<string, number>();
  if (!fallback) {
    const supabase = await createClient();
    const { data } = await supabase.from("solution_subscriptions").select("solutions").neq("status", "ended");
    for (const row of data ?? []) for (const k of row.solutions ?? []) usage.set(k, (usage.get(k) ?? 0) + 1);
  }

  const byCategory = APP_CATEGORIES.map((c) => ({ ...c, apps: apps.filter((a) => a.category === c.key) }));
  const others = apps.filter((a) => !APP_CATEGORIES.some((c) => c.key === a.category));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/solutions" className="text-xs text-muted-foreground hover:underline">
            ← 솔루션 마켓
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-secondary">앱 카탈로그</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            마켓에 올릴 솔루션(앱)을 관리합니다. &lsquo;이용 가능&rsquo; 앱만 담을 수 있고, &lsquo;출시 예정&rsquo;은 카드만
            보입니다. 구독에 쓰인 앱은 삭제 대신 &lsquo;숨김&rsquo;으로 내려주세요.
          </p>
        </div>
        {fallback ? (
          <Button disabled>+ 앱 추가</Button>
        ) : (
          <Button asChild>
            <Link href="/admin/solutions/apps/new">+ 앱 추가</Link>
          </Button>
        )}
      </div>

      {fallback ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          앱 카탈로그 테이블이 아직 없습니다. Supabase에서 마이그레이션 <strong>033_solution_market.sql</strong>을 실행하면
          앱을 추가·수정할 수 있습니다. (지금은 기본 3종으로 표시 중)
        </p>
      ) : null}

      {[...byCategory, ...(others.length > 0 ? [{ key: "other", label: "기타", desc: "", apps: others }] : [])].map((c) => (
        <section key={c.key}>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            {c.label} <span className="font-normal">({c.apps.length})</span>
          </h2>
          {c.apps.length === 0 ? (
            <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
              등록된 앱이 없습니다 — 공개 페이지에는 &lsquo;출시 준비 중&rsquo;으로 표시됩니다.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-16 px-4 py-2.5 font-medium">순서</th>
                    <th className="px-4 py-2.5 font-medium">앱</th>
                    <th className="px-4 py-2.5 font-medium">한 줄 소개</th>
                    <th className="px-4 py-2.5 font-medium">상태</th>
                    <th className="px-4 py-2.5 font-medium">구독 사용</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {c.apps.map((a: MarketApp) => (
                    <tr key={a.key} className={a.status === "hidden" ? "text-muted-foreground" : undefined}>
                      <td className="px-4 py-2.5 align-top text-xs">{a.sort}</td>
                      <td className="px-4 py-2.5 align-top">
                        <p className="font-semibold text-foreground">{appLabel(a)}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.brand ? `${a.name} · ` : ""}
                          <code>{a.key}</code> · {categoryLabel(a.category)}
                        </p>
                      </td>
                      <td className="max-w-md px-4 py-2.5 align-top text-xs text-muted-foreground">{a.summary}</td>
                      <td className="px-4 py-2.5 align-top">
                        <Badge variant={STATUS_VARIANT[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge>
                      </td>
                      <td className="px-4 py-2.5 align-top text-xs">{usage.get(a.key) ?? 0}건</td>
                      <td className="px-4 py-2.5 text-right align-top">
                        {fallback ? null : (
                          <Link href={`/admin/solutions/apps/${a.key}`} className="text-xs font-medium text-primary hover:underline">
                            수정 →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
